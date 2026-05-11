import path from "node:path";

import { titleFromRoute, routeToPageFile } from "./routes.mjs";

const PAGE_SHELL_CLASS =
  "mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6 py-16";

function moduleNameForRoute(route) {
  const filePath = routeToPageFile(route).replace(/^src\//, "").replace(/\.purs$/, "");
  return filePath.split(path.sep).join(".");
}

function escapeText(value) {
  return value.replace(/"/g, '\\"');
}

function staticTemplate(route, templateKind = "Static", extraBody = "") {
  const title = titleFromRoute(route);
  const backHomeLink =
    route === "/"
      ? `          , H.p
              [ H.className "text-sm text-slate-500" ]
              [ H.text "Add more pages with ps-spa add, then link them from this home page." ]`
      : `          , Link.link
              Index
              [ H.className "w-fit rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800" ]
              [ H.text "Back home" ]`;

  return `module ${moduleNameForRoute(route)}
  ( hasSubscriptions
  , kind
  , page
  , protect
  , view
  ) where

import Prelude
import Data.Maybe (Maybe(..))
import Generated.Link as Link
import Generated.Route (Request, Route(..))
import PsSpa.Html as H
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind(..))
import PsSpa.View (Document)

page :: forall shared command subscription. Request -> Page.Page Unit Void shared Route command subscription
page _ =
  Page.static
    { view }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

view :: Document Void
view =
  { title: "${escapeText(title)}"
  , body:
      [ H.main
          [ H.className "${PAGE_SHELL_CLASS}" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text "${escapeText(title)}" ]
          , H.p
              [ H.className "text-lg text-slate-600" ]
              [ H.text "Generated ${templateKind.toLowerCase()} page for route ${route}." ]
${backHomeLink}
          ${extraBody}
          ]
      ]
  }

kind :: PageKind
kind = ${templateKind}

hasSubscriptions :: Boolean
hasSubscriptions = false
`;
}

function sandboxTemplate(route) {
  const title = titleFromRoute(route);

  return `module ${moduleNameForRoute(route)}
  ( Model
  , Msg(..)
  , hasSubscriptions
  , init
  , kind
  , page
  , protect
  , update
  , view
  ) where

import Prelude

import Data.Maybe (Maybe(..))
import Generated.Link as Link
import Generated.Route (Request, Route(..))
import PsSpa.Html as H
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind(..))
import PsSpa.View (Document)

type Model =
  { counter :: Int
  }

data Msg
  = Increment
  | Decrement

page :: forall shared command subscription. Request -> Page.Page Model Msg shared Route command subscription
page _ =
  Page.sandbox
    { init
    , update
    , view
    }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

init :: Model
init =
  { counter: 0
  }

update :: Msg -> Model -> Model
update msg model =
  case msg of
    Increment ->
      { counter: model.counter + 1 }

    Decrement ->
      { counter: model.counter - 1 }

view :: Model -> Document Msg
view model =
  { title: "${escapeText(title)}"
  , body:
      [ H.main
          [ H.className "${PAGE_SHELL_CLASS}" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text "${escapeText(title)}" ]
          , H.p
              [ H.className "text-lg text-slate-600" ]
              [ H.text "Sandbox page with local state." ]
          , H.div
              [ H.className "flex items-center gap-3" ]
              [ H.button
                  [ H.className "rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
                  , H.onClick Decrement
                  ]
                  [ H.text "-" ]
              , H.p
                  [ H.className "min-w-12 text-center text-2xl font-semibold text-slate-950" ]
                  [ H.text (show model.counter) ]
              , H.button
                  [ H.className "rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
                  , H.onClick Increment
                  ]
                  [ H.text "+" ]
              ]
          , Link.link
              Index
              [ H.className "w-fit text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4" ]
              [ H.text "Back home" ]
          ]
      ]
  }

kind :: PageKind
kind = Sandbox

hasSubscriptions :: Boolean
hasSubscriptions = false
`;
}

function elementTemplate(route) {
  const title = titleFromRoute(route);

  return `module ${moduleNameForRoute(route)}
  ( Model
  , Msg(..)
  , hasSubscriptions
  , init
  , kind
  , page
  , protect
  , subscriptions
  , update
  , view
  ) where

import Prelude

import Data.Maybe (Maybe(..))
import Generated.Link as Link
import Generated.Route (Request, Route(..))
import PsSpa.Html as H
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind(..))
import PsSpa.View (Document)

type Model =
  { status :: String
  }

data Msg
  = Triggered

page :: forall shared command subscription. Request -> Page.Page Model Msg shared Route command subscription
page _ =
  Page.element
    { init
    , update
    , view
    , subscriptions
    }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

init :: forall command. Page.Step Model (Array command)
init =
  { model:
      { status: "idle"
      }
  , effect: []
  }

update :: forall command. Msg -> Model -> Page.Step Model (Array command)
update msg model =
  case msg of
    Triggered ->
      { model:
          { status: "updated"
          }
      , effect: []
      }

subscriptions :: forall subscription. Model -> Array subscription
subscriptions _ =
  []

view :: Model -> Document Msg
view model =
  { title: "${escapeText(title)}"
  , body:
      [ H.main
          [ H.className "${PAGE_SHELL_CLASS}" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text "${escapeText(title)}" ]
          , H.p
              [ H.className "text-lg text-slate-600" ]
              [ H.text "Element page with command and subscription hooks." ]
          , H.p
              [ H.className "rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700" ]
              [ H.text ("Current status: " <> model.status) ]
          , H.button
              [ H.className "w-fit rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              , H.onClick Triggered
              ]
              [ H.text "Trigger update" ]
          , Link.link
              Index
              [ H.className "w-fit text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4" ]
              [ H.text "Back home" ]
          ]
      ]
  }

kind :: PageKind
kind = Element

hasSubscriptions :: Boolean
hasSubscriptions = true
`;
}

function advancedTemplate(route) {
  const title = titleFromRoute(route);

  return `module ${moduleNameForRoute(route)}
  ( Model
  , Msg(..)
  , hasSubscriptions
  , init
  , kind
  , page
  , protect
  , subscriptions
  , update
  , view
  ) where

import Prelude

import Data.Maybe (Maybe(..))
import Generated.Link as Link
import Generated.Route (Request, Route(..))
import PsSpa.Effect as Effect
import PsSpa.Html as H
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind(..))
import PsSpa.View (Document)

type Model =
  { status :: String
  }

data Msg
  = Triggered

page :: forall shared command subscription. Request -> Page.Page Model Msg shared Route command subscription
page _ =
  Page.advanced
    { init
    , update
    , view
    , subscriptions
    }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

init :: forall shared route command. Page.Step Model (Effect.Effect command shared route)
init =
  { model:
      { status: "ready"
      }
  , effect: Effect.none
  }

update :: forall shared route command. Msg -> Model -> Page.Step Model (Effect.Effect command shared route)
update msg model =
  case msg of
    Triggered ->
      { model:
          { status: "handled"
          }
      , effect: Effect.none
      }

subscriptions :: forall subscription. Model -> Array subscription
subscriptions _ =
  []

view :: Model -> Document Msg
view model =
  { title: "${escapeText(title)}"
  , body:
      [ H.main
          [ H.className "${PAGE_SHELL_CLASS}" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text "${escapeText(title)}" ]
          , H.p
              [ H.className "text-lg text-slate-600" ]
              [ H.text "Advanced page with shared effects, navigation hooks, and subscriptions." ]
          , H.p
              [ H.className "rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" ]
              [ H.text ("Current status: " <> model.status) ]
          , H.button
              [ H.className "w-fit rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
              , H.onClick Triggered
              ]
              [ H.text "Run advanced update" ]
          , Link.link
              Index
              [ H.className "w-fit text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4" ]
              [ H.text "Back home" ]
          ]
      ]
  }

kind :: PageKind
kind = Advanced

hasSubscriptions :: Boolean
hasSubscriptions = true
`;
}

function tailwindTemplate(route) {
  return staticTemplate(
    route,
    "Tailwind",
    `, H.section
              [ H.className "grid gap-4 md:grid-cols-2" ]
              [ H.div
                  [ H.className "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" ]
                  [ H.p
                      [ H.className "text-sm font-semibold uppercase tracking-[0.2em] text-sky-600" ]
                      [ H.text "Tailwind ready" ]
                  , H.h1
                      [ H.className "mt-3 text-3xl font-bold tracking-tight text-slate-950" ]
                      [ H.text "A stronger starter than a placeholder." ]
                  , H.p
                      [ H.className "mt-3 text-base text-slate-600" ]
                      [ H.text "This template scaffolds Tailwind config files and gives the page a real visual starting point." ]
                  ]
              , H.div
                  [ H.className "rounded-3xl bg-slate-950 p-6 text-white" ]
                  [ H.p
                      [ H.className "text-sm font-semibold uppercase tracking-[0.2em] text-sky-300" ]
                      [ H.text "Next steps" ]
                  , H.p
                      [ H.className "mt-3 text-base text-slate-200" ]
                      [ H.text "Run npm install or bun install, then start the app with npm run dev or bun run dev." ]
                  ]
              ]`
  );
}

const templates = {
  advanced: advancedTemplate,
  element: elementTemplate,
  sandbox: sandboxTemplate,
  static: (route) => staticTemplate(route),
  tailwind: tailwindTemplate
};

export function generatePageTemplate(route, template = "static") {
  const builder = templates[template];

  if (!builder) {
    throw new Error(
      `Unknown template "${template}". Expected one of: ${Object.keys(templates).join(", ")}`
    );
  }

  return builder(route);
}
