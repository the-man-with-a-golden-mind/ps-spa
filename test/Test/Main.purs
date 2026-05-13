module Test.Main where

import Prelude

import Data.Maybe (Maybe(..))
import Data.String.Common (joinWith)
import Data.String.CodeUnits as String
import Effect (Effect)
import Effect.Console as Console
import PsSpa.Effect as SpaEffect
import PsSpa.Html as Html
import PsSpa.LoadResult as LoadResult
import PsSpa.LoadedPage as LoadedPage
import PsSpa.Option (Option(..))
import PsSpa.Page as Page
import PsSpa.Request as Request
import PsSpa.View as View
import Test.Assert (assertEqual, assertTrue, failTest, group)

main :: Effect Unit
main = do
  group "PsSpa.Request"
    [ requestHelpersWork
    , requestHelpersHandleInvalidValues
    ]
  group "PsSpa.Html and View"
    [ htmlHelpersBuildExpectedAttributes
    , htmlFunctorAndViewMapLiftMessages
    ]
  group "PsSpa.Effect"
    [ effectMapCommandRecurses
    , effectMapSharedAndRoutePreserveOtherBranches
    ]
  group "PsSpa.Page and loading"
    [ pageHelpersWrapExpectedConstructors
    , loadedPageRoundTrips
    , loadResultSupportsLoadedAndRedirect
    ]
  Console.log "PureScript framework tests passed"

requestHelpersWork :: Effect Unit
requestHelpersWork = do
  let
    request =
      { route: "GuidesRouting"
      , params: { slug: "routing" }
      , path: [ "guides", "routing" ]
      , query:
          [ { key: "page", value: "2" }
          , { key: "tag", value: "purescript" }
          , { key: "tag", value: "spa" }
          , { key: "flag", value: "yes" }
          ]
      , fragment: Some "top"
      , href: "/guides/routing?page=2&tag=purescript&tag=spa&flag=yes#top"
      }

  assertEqual "queryParam returns first matching value" (Just "2") (Request.queryParam "page" request)
  assertEqual "queryParams returns all matching values" [ "purescript", "spa" ] (Request.queryParams "tag" request)
  assertTrue "hasQueryParam detects existing keys" (Request.hasQueryParam "flag" request)
  assertEqual "queryInt decodes integers" (Just 2) (Request.queryInt "page" request)
  assertEqual "queryBoolean decodes yes=true" (Just true) (Request.queryBoolean "flag" request)
  assertEqual "fragmentValue exposes fragment content" (Just "top") (Request.fragmentValue request)

requestHelpersHandleInvalidValues :: Effect Unit
requestHelpersHandleInvalidValues = do
  let
    request =
      { route: "Index"
      , params: {}
      , path: []
      , query:
          [ { key: "page", value: "oops" }
          , { key: "flag", value: "maybe" }
          ]
      , fragment: None
      , href: "/?page=oops&flag=maybe"
      }

  assertEqual "missing query key returns Nothing" Nothing (Request.queryParam "missing" request)
  assertEqual "invalid integer returns Nothing" Nothing (Request.queryInt "page" request)
  assertEqual "invalid boolean returns Nothing" Nothing (Request.queryBoolean "flag" request)
  assertTrue "hasQueryParam is false for absent keys" (not (Request.hasQueryParam "tag" request))
  assertEqual "fragmentValue returns Nothing for None" Nothing (Request.fragmentValue request)

htmlHelpersBuildExpectedAttributes :: Effect Unit
htmlHelpersBuildExpectedAttributes = do
  assertAttribute "className builds class attr" (Html.className "stack") "class=stack"
  assertAttribute "classes joins class names" (Html.classes [ "stack", "gap-4" ]) "class=stack gap-4"
  assertAttribute "buttonType renders submit" (Html.buttonType Html.ButtonSubmit) "type=submit"
  assertAttribute "role renders aria role" (Html.role Html.RoleNavigation) "role=navigation"
  assertAttribute "disabled true uses disabled attr" (Html.disabled true) "disabled=disabled"
  assertAttribute "dataAttr prefixes data-" (Html.dataAttr "state" "open") "data-state=open"
  assertAttribute "ariaLabel prefixes aria-" (Html.ariaLabel "Menu") "aria-label=Menu"

htmlFunctorAndViewMapLiftMessages :: Effect Unit
htmlFunctorAndViewMapLiftMessages = do
  let
    document =
      { title: "Actions"
      , body:
          [ Html.button
              [ Html.className "cta"
              , Html.onClick "save"
              ]
              [ Html.text "Save" ]
          ]
      }
    mapped = View.map String.length document

  assertEqual "View.map preserves document title" "Actions" mapped.title
  assertEqual
    "View.map lifts nested Html messages"
    "button[class=cta,click:4]{text(Save)}"
    (joinWith "|" (serializeHtml <$> mapped.body))

effectMapCommandRecurses :: Effect Unit
effectMapCommandRecurses = do
  let
    effect :: SpaEffect.Effect String Int String
    effect =
      SpaEffect.batch
        [ SpaEffect.none
        , SpaEffect.fromCommand "save"
        , SpaEffect.batch [ SpaEffect.fromCommand "sync" ]
        , SpaEffect.push "dashboard"
        ]
    mapped = SpaEffect.mapCommand String.length effect

  assertEqual
    "mapCommand rewrites command branches recursively"
    "batch[none,command(4),batch[command(4)],push(\"dashboard\")]"
    (serializeEffect mapped)

effectMapSharedAndRoutePreserveOtherBranches :: Effect Unit
effectMapSharedAndRoutePreserveOtherBranches = do
  let
    effect :: SpaEffect.Effect String Int String
    effect =
      SpaEffect.batch
        [ SpaEffect.fromShared 7
        , SpaEffect.replace "settings"
        , SpaEffect.fromCommand "refresh"
        ]
    mappedShared = SpaEffect.mapShared (\value -> "shared-" <> show value) effect
    mappedRoute = SpaEffect.mapRoute (\route -> "/app/" <> route) mappedShared

  assertEqual
    "mapShared transforms only shared payloads"
    "batch[shared(\"shared-7\"),replace(\"settings\"),command(\"refresh\")]"
    (serializeEffect mappedShared)
  assertEqual
    "mapRoute transforms only route payloads"
    "batch[shared(\"shared-7\"),replace(\"/app/settings\"),command(\"refresh\")]"
    (serializeEffect mappedRoute)

pageHelpersWrapExpectedConstructors :: Effect Unit
pageHelpersWrapExpectedConstructors = do
  let
    staticPage = Page.static { view: emptyDocument "Static" }
    sandboxPage =
      Page.sandbox
        { init: 0
        , update: \msg model -> model + msg
        , view: \model -> emptyDocument ("Sandbox " <> show model)
        }
    elementPage =
      Page.element
        { init: { model: 1, effect: [ "boot" ] }
        , update: \msg model -> { model: model + msg, effect: [ "tick" ] }
        , view: \model -> emptyDocument ("Element " <> show model)
        , subscriptions: \_ -> [ Nothing ]
        }
    advancedPage =
      Page.advanced
        { init: { model: 2, effect: SpaEffect.push "home" }
        , update: \msg model -> { model: model + msg, effect: SpaEffect.replace "settings" }
        , view: \model -> emptyDocument ("Advanced " <> show model)
        , subscriptions: \_ -> [ Nothing ]
        }

  assertEqual "static helper wraps StaticPage" "static" (pageTag staticPage)
  assertEqual "sandbox helper wraps SandboxPage" "sandbox" (pageTag sandboxPage)
  assertEqual "element helper wraps ElementPage" "element" (pageTag elementPage)
  assertEqual "advanced helper wraps AdvancedPage" "advanced" (pageTag advancedPage)

loadedPageRoundTrips :: Effect Unit
loadedPageRoundTrips = do
  let
    loaded = LoadedPage.fromPage (Page.static { view: emptyDocument "Loaded" })
  assertEqual "LoadedPage.withPage re-opens stored page" "static" (LoadedPage.withPage pageTag loaded)

loadResultSupportsLoadedAndRedirect :: Effect Unit
loadResultSupportsLoadedAndRedirect = do
  let
    redirect = LoadResult.Redirect "login"
    loaded = LoadResult.Loaded (LoadedPage.fromPage (Page.static { view: emptyDocument "Ready" }))

  case redirect of
    LoadResult.Redirect route ->
      assertEqual "Redirect carries target route" "login" route

    _ ->
      failTest "Expected Redirect constructor"

  case loaded of
    LoadResult.Loaded page ->
      assertEqual "Loaded carries a page payload" "static" (LoadedPage.withPage pageTag page)

    _ ->
      failTest "Expected Loaded constructor"

emptyDocument :: forall msg. String -> View.Document msg
emptyDocument title =
  { title, body: [] }

assertAttribute :: forall msg. String -> Html.Attribute msg -> String -> Effect Unit
assertAttribute label attribute expected =
  case attribute of
    Html.Attribute key value ->
      assertEqual label expected (key <> "=" <> value)

    Html.OnClick _ ->
      failTest ("Expected plain attribute in test: " <> label)

serializeAttribute :: forall msg. Show msg => Html.Attribute msg -> String
serializeAttribute attribute =
  case attribute of
    Html.Attribute key value ->
      key <> "=" <> value

    Html.OnClick msg ->
      "click:" <> show msg

serializeHtml :: forall msg. Show msg => Html.Html msg -> String
serializeHtml html =
  case html of
    Html.Text value ->
      "text(" <> value <> ")"

    Html.Element tag attrs children ->
      tag
        <> "["
        <> joinWith "," (serializeAttribute <$> attrs)
        <> "]{"
        <> joinWith "|" (serializeHtml <$> children)
        <> "}"

serializeEffect :: forall command shared route. Show command => Show shared => Show route => SpaEffect.Effect command shared route -> String
serializeEffect effect =
  case effect of
    SpaEffect.None ->
      "none"

    SpaEffect.Batch items ->
      "batch[" <> joinWith "," (serializeEffect <$> items) <> "]"

    SpaEffect.FromCommand command ->
      "command(" <> show command <> ")"

    SpaEffect.FromShared shared ->
      "shared(" <> show shared <> ")"

    SpaEffect.Push route ->
      "push(" <> show route <> ")"

    SpaEffect.Replace route ->
      "replace(" <> show route <> ")"

pageTag :: forall model msg shared route command subscription. Page.Page model msg shared route command subscription -> String
pageTag page =
  case page of
    Page.StaticPage _ ->
      "static"

    Page.SandboxPage _ ->
      "sandbox"

    Page.ElementPage _ ->
      "element"

    Page.AdvancedPage _ ->
      "advanced"
