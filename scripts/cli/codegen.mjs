import path from "node:path";

import { isDynamicSegment, segmentToParamName, segmentToRoutePart } from "./naming.mjs";

export function ensureUniquePaths(routes) {
  const seen = new Map();

  for (const route of routes) {
    if (route.isNotFound) continue;
    if (seen.has(route.path)) {
      throw new Error(
        `Duplicate route "${route.path}" from ${route.pageFile} and ${seen.get(route.path)}`
      );
    }

    seen.set(route.path, route.pageFile);
  }
}

function renderRouteConstructor(route) {
  if (route.isNotFound) return "  | NotFound";
  if (route.dynamicParams.length === 0) return `  | ${route.constructor}`;

  return `  | ${route.constructor} { ${route.dynamicParams.map((param) => `${param} :: String`).join(", ")} }`;
}

function renderToPathBranch(route) {
  if (route.isNotFound) {
    return '    NotFound -> "/not-found"';
  }

  if (route.dynamicParams.length === 0) {
    return `    ${route.constructor} -> "${route.path}"`;
  }

  let rendered = '""';

  for (const segment of route.routeSegments) {
    if (segment === "Index") continue;

    if (isDynamicSegment(segment)) {
      rendered += ` <> "/\" <> params.${segmentToParamName(segment)}`;
    } else {
      rendered += ` <> "/${segmentToRoutePart(segment)}"`;
    }
  }

  return `    ${route.constructor} params -> ${rendered}`;
}

function renderParseBranch(route) {
  if (route.isNotFound) return null;

  if (route.routePattern === "/") {
    return `    [] -> ${route.constructor}`;
  }

  const pattern = route.routeSegments
    .filter((segment) => segment !== "Index")
    .map((segment) => (isDynamicSegment(segment) ? segmentToParamName(segment) : `"${segmentToRoutePart(segment)}"`))
    .join(", ");

  if (route.dynamicParams.length === 0) {
    return `    [ ${pattern} ] -> ${route.constructor}`;
  }

  return `    [ ${pattern} ] -> ${route.constructor} { ${route.dynamicParams
    .map((param) => `${param}: ${param}`)
    .join(", ")} }`;
}

function renderPagesImport(route) {
  return `import ${route.moduleName} as ${route.constructor}Page`;
}

function renderPageMetaName(route) {
  return `meta${route.constructor}`;
}

function renderPageMeta(route) {
  return `${renderPageMetaName(route)} :: PageMeta
${renderPageMetaName(route)} =
  { moduleName: "${route.moduleName}"
  , sourcePath: "${route.pageFile.split(path.sep).join("/")}"
  , routePattern: "${route.routePattern}"
  , kind: ${route.constructor}Page.kind
  , hasSubscriptions: ${route.constructor}Page.hasSubscriptions
  }`;
}

function renderPageForRouteBranch(route) {
  if (route.isNotFound) {
    return `    NotFound -> ${renderPageMetaName(route)}`;
  }

  if (route.dynamicParams.length === 0) {
    return `    ${route.constructor} -> ${renderPageMetaName(route)}`;
  }

  return `    ${route.constructor} _ -> ${renderPageMetaName(route)}`;
}

function renderLoadPageBranch(route) {
  if (route.isNotFound) {
    return `    NotFound -> decide ${route.constructor}Page.page ${route.constructor}Page.protect shared request`;
  }

  if (route.dynamicParams.length === 0) {
    return `    ${route.constructor} -> decide ${route.constructor}Page.page ${route.constructor}Page.protect shared request`;
  }

  return `    ${route.constructor} _ -> decide ${route.constructor}Page.page ${route.constructor}Page.protect shared request`;
}

export function generateRouteModule(routes) {
  ensureUniquePaths(routes);

  const constructorLines = routes.map(renderRouteConstructor);
  const dataConstructors = constructorLines
    .map((line, index) => (index === 0 ? line.replace("  |", "  =") : line))
    .join("\n");

  return `module Generated.Route
  ( Route(..)
  , Request
  , parsePath
  , parseRequest
  , toPath
  ) where

import Prelude

import Data.Array (filter, uncons)
import Data.Foldable (foldl)
import Data.Maybe (Maybe(..))
import Data.String.CodeUnits as CodeUnits
import Data.String.Common (split)
import Data.String.Pattern (Pattern(..))
import PsSpa.Option as Option
import PsSpa.Request as SpaRequest

data Route
${dataConstructors || "  = NotFound"}

type Request =
  SpaRequest.Request Route Route

toPath :: Route -> String
toPath route =
  case route of
${routes.map(renderToPathBranch).join("\n")}

parsePath :: String -> Route
parsePath href =
  case splitSegments href of
${routes.map(renderParseBranch).filter(Boolean).join("\n")}
    _ -> NotFound

parseRequest :: String -> Request
parseRequest href =
  let
    route = parsePath href
    path = splitSegments href
  in
    { route
    , params: route
    , path
    , query: parseQuery href
    , fragment: parseFragment href
    , href
    }

splitSegments :: String -> Array String
splitSegments href =
  filter (_ /= "") (split (Pattern "/") (stripFragment (stripQuery href)))

stripQuery :: String -> String
stripQuery =
  takeBefore (Pattern "?")

stripFragment :: String -> String
stripFragment =
  takeBefore (Pattern "#")

takeBefore :: Pattern -> String -> String
takeBefore pattern value =
  case CodeUnits.indexOf pattern value of
    Just index ->
      CodeUnits.take index value

    Nothing ->
      value

takeAfter :: Pattern -> String -> Maybe String
takeAfter pattern value =
  case CodeUnits.indexOf pattern value of
    Just index ->
      Just (CodeUnits.drop (index + 1) value)

    Nothing ->
      Nothing

parseFragment :: String -> Option.Option String
parseFragment href =
  case takeAfter (Pattern "#") href of
    Just fragment ->
      Option.Some fragment

    Nothing ->
      Option.None

parseQuery :: String -> Array SpaRequest.QueryParam
parseQuery href =
  case takeAfter (Pattern "?") (stripFragment href) of
    Just queryString ->
      parseQueryPairs queryString

    Nothing ->
      []

parseQueryPairs :: String -> Array SpaRequest.QueryParam
parseQueryPairs raw =
  split (Pattern "&") raw
    # filter (_ /= "")
    # map parseQueryParam

parseQueryParam :: String -> SpaRequest.QueryParam
parseQueryParam chunk =
  case uncons (split (Pattern "=") chunk) of
    Just { head: key, tail: valueParts } ->
      { key
      , value: joinWithEquals valueParts
      }

    Nothing ->
      { key: ""
      , value: ""
      }

joinWithEquals :: Array String -> String
joinWithEquals parts =
  case uncons parts of
    Nothing ->
      ""

    Just { head: first, tail: rest } ->
      foldl (\\acc next -> acc <> "=" <> next) first rest
`;
}

export function generatePagesModule(routes) {
  return `module Generated.Pages
  ( PageMeta
  , loadPage
  , pageForRoute
  , pages
  ) where

import Data.Maybe (Maybe(..))
import Generated.Route (Request, Route(..))
import PsSpa.LoadResult as LoadResult
import PsSpa.LoadedPage as LoadedPage
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind)
${routes.map(renderPagesImport).join("\n")}

type PageMeta =
  { moduleName :: String
  , sourcePath :: String
  , routePattern :: String
  , kind :: PageKind
  , hasSubscriptions :: Boolean
  }

pages :: Array PageMeta
pages =
  [ ${routes.map(renderPageMetaName).join("\n  , ")}
  ]

pageForRoute :: Route -> PageMeta
pageForRoute route =
  case route of
${routes.map(renderPageForRouteBranch).join("\n")}

loadPage
  :: forall shared command subscription
   . shared
  -> Request
  -> LoadResult.LoadResult shared Route command subscription
loadPage shared request =
  case request.route of
${routes.map(renderLoadPageBranch).join("\n")}

decide
  :: forall model msg shared command subscription
   . (Request -> Page.Page model msg shared Route command subscription)
  -> (shared -> Request -> Maybe Route)
  -> shared
  -> Request
  -> LoadResult.LoadResult shared Route command subscription
decide load protect shared request =
  case protect shared request of
    Just redirect ->
      LoadResult.Redirect redirect

    Nothing ->
      LoadResult.Loaded (LoadedPage.fromPage (load request))

${routes.map(renderPageMeta).join("\n\n")}
`;
}

export function generateLinkModule() {
  return `module Generated.Link
  ( href
  , link
  ) where

import Prelude

import Generated.Route (Route, toPath)
import PsSpa.Html as Html

href :: forall msg. Route -> Html.Attribute msg
href route =
  Html.href (toPath route)

link :: forall msg. Route -> Array (Html.Attribute msg) -> Array (Html.Html msg) -> Html.Html msg
link route attrs children =
  Html.a ([ href route ] <> attrs) children
`;
}

export function generateAppModule() {
  return `module Generated.App
  ( AppConfig
  , start
  , startWith
  ) where

import Prelude

import Effect (Effect)
import Generated.Pages as Pages
import Generated.Route as Route
import PsSpa.Browser as Browser
import PsSpa.Runtime as Runtime

type AppConfig shared command subscription =
  { initialShared :: shared
  , onCommand :: command -> Effect Unit
  , onSubscription :: subscription -> Effect Browser.Cleanup
  , rootId :: String
  , sharedSubscriptions :: Route.Request -> shared -> Array subscription
  }

start :: Effect Unit
start =
  startWith
    { initialShared: unit
    , onCommand: absurd
    , onSubscription: absurd
    , rootId: "app"
    , sharedSubscriptions: \\_ _ -> []
    }

startWith :: forall shared command subscription. AppConfig shared command subscription -> Effect Unit
startWith config =
  Runtime.start
    { initialShared: config.initialShared
    , loadPage: Pages.loadPage
    , onCommand: config.onCommand
    , onSubscription: config.onSubscription
    , parseRequest: Route.parseRequest
    , rootId: config.rootId
    , sharedSubscriptions: config.sharedSubscriptions
    , toPath: Route.toPath
    }
`;
}
