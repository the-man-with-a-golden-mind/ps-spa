module Test.Main where

import Prelude

import Data.Array (length, sort)
import Data.Array as Data.Array
import Data.Foldable (any, for_)
import Data.Maybe (Maybe(..))
import Data.String.Common (joinWith)
import Data.String.CodeUnits as String
import Data.Tuple (Tuple(..))
import Effect (Effect)
import Effect.Console as Console
import PsSpa.Effect as SpaEffect
import PsSpa.Html as Html
import PsSpa.Html.DSL as D
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
  group "PsSpa.Html.DSL — elements"
    [ dslContainerElementsAllCovered
    , dslVoidElementsAllCovered
    ]
  group "PsSpa.Html.DSL — attributes"
    [ dslStringAttributesMapToCorrectNames
    , dslBooleanAttributesRespectTrueFalse
    , dslAriaBooleanAttributesAlwaysEmit
    , dslIntegerAttributesAreStringified
    , dslOnClickPreservesMessage
    , dslMultipleAttributesCompose
    , dslEmptyRecordYieldsNoAttributes
    , dslVoidElementProducesNoChildren
    ]
  group "PsSpa.Html.DSL — nesting"
    [ dslDeepNestingPreservesStructure
    , dslInteropWithExistingHtmlHelpers
    , dslCustomMsgTypePropagatesAcrossNesting
    ]
  group "PsSpa.Html.DSL — extra attribute coverage"
    [ dslLinkAttributesAllSupported
    , dslMediaAttributesAllSupported
    , dslFormAttributesAllSupported
    , dslAriaAttributesStringFamily
    , dslMetaAndScriptAttributesSupported
    , dslTableAttributesSupported
    , dslIntegerAndStringOverloadsCoexist
    ]
  group "PsSpa.Html.DSL — globals + extended ARIA"
    [ dslGlobalAttributesSupported
    , dslAriaCompleteCoverage
    ]
  group "PsSpa.Html.DSL — generic data-* / aria-*"
    [ dslDataAttrsExpandToMultipleAttributes
    , dslAriaAttrsExpandToMultipleAttributes
    , dslGenericAttrsComposeWithSpecificOnes
    ]
  group "PsSpa.Html.DSL — events"
    [ dslOnInputCarriesTargetValue
    , dslOnChangeCarriesTargetValue
    , dslOnSubmitFiresWithoutPayload
    , dslOnKeyDownAndOnKeyUpCarryKey
    , dslOnFocusOnBlurOnDoubleClick
    , dslOnMouseEnterOnMouseLeave
    , dslMultipleEventsOnOneElement
    ]
  group "README cookbook recipes compile and produce expected shape"
    [ cookbookConditionalRender
    , cookbookListOfItems
    , cookbookConditionalClassName
    , cookbookCustomElement
    ]
  group "PsSpa.Html.keyed and DSL.keyed"
    [ keyedHtmlBuildsExpectedShape
    , keyedDslAppliesAttributeMapping
    , keyedFunctorMapTraversesChildren
    , keyedEmptyChildrenProduceEmptyBody
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

    Html.OnEvent _ _ ->
      failTest ("Expected plain attribute in test: " <> label)

serializeAttribute :: forall msg. Show msg => Html.Attribute msg -> String
serializeAttribute attribute =
  case attribute of
    Html.Attribute key value ->
      key <> "=" <> value

    Html.OnClick msg ->
      "click:" <> show msg

    Html.OnEvent name _ ->
      "event:" <> name

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

    Html.Keyed record ->
      record.tag
        <> "[*"
        <> joinWith "," (serializeAttribute <$> record.attrs)
        <> "]{"
        <> joinWith "|"
            ( (\(Tuple key child) -> key <> "=>" <> serializeHtml child)
                <$> record.children
            )
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

----------------------------------------------------------------------
-- DSL tests
----------------------------------------------------------------------

htmlTag :: forall msg. Html.Html msg -> String
htmlTag html =
  case html of
    Html.Element tag _ _ -> tag
    Html.Keyed record -> record.tag
    Html.Text _ -> "<text>"

htmlChildren :: forall msg. Html.Html msg -> Array (Html.Html msg)
htmlChildren html =
  case html of
    Html.Element _ _ children -> children
    Html.Keyed record -> (\(Tuple _ child) -> child) <$> record.children
    Html.Text _ -> []

htmlAttrs :: forall msg. Html.Html msg -> Array (Html.Attribute msg)
htmlAttrs html =
  case html of
    Html.Element _ attrs _ -> attrs
    Html.Keyed record -> record.attrs
    Html.Text _ -> []

assertElementShape
  :: forall msg
   . Show msg
  => String
  -> Html.Html msg
  -> { tag :: String, attrs :: Array String, childCount :: Int }
  -> Effect Unit
assertElementShape label html expected = do
  assertEqual (label <> " — tag") expected.tag (htmlTag html)
  assertEqual (label <> " — attrs")
    (sort expected.attrs)
    (sort (serializeAttribute <$> htmlAttrs html))
  assertEqual (label <> " — child count") expected.childCount (length (htmlChildren html))

dslContainerElementsAllCovered :: Effect Unit
dslContainerElementsAllCovered = do
  let
    elements :: Array { tag :: String, html :: Html.Html String }
    elements =
      [ { tag: "a",          html: D.a {} [] }
      , { tag: "abbr",       html: D.abbr {} [] }
      , { tag: "address",    html: D.address {} [] }
      , { tag: "article",    html: D.article {} [] }
      , { tag: "aside",      html: D.aside {} [] }
      , { tag: "audio",      html: D.audio {} [] }
      , { tag: "b",          html: D.b {} [] }
      , { tag: "bdi",        html: D.bdi {} [] }
      , { tag: "bdo",        html: D.bdo {} [] }
      , { tag: "blockquote", html: D.blockquote {} [] }
      , { tag: "body",       html: D.body {} [] }
      , { tag: "button",     html: D.button {} [] }
      , { tag: "canvas",     html: D.canvas {} [] }
      , { tag: "caption",    html: D.caption {} [] }
      , { tag: "cite",       html: D.cite {} [] }
      , { tag: "code",       html: D.code {} [] }
      , { tag: "colgroup",   html: D.colgroup {} [] }
      , { tag: "data",       html: D.data_ {} [] }
      , { tag: "datalist",   html: D.datalist {} [] }
      , { tag: "dd",         html: D.dd {} [] }
      , { tag: "del",        html: D.del {} [] }
      , { tag: "details",    html: D.details {} [] }
      , { tag: "dfn",        html: D.dfn {} [] }
      , { tag: "dialog",     html: D.dialog {} [] }
      , { tag: "div",        html: D.div {} [] }
      , { tag: "dl",         html: D.dl {} [] }
      , { tag: "dt",         html: D.dt {} [] }
      , { tag: "em",         html: D.em {} [] }
      , { tag: "fieldset",   html: D.fieldset {} [] }
      , { tag: "figcaption", html: D.figcaption {} [] }
      , { tag: "figure",     html: D.figure {} [] }
      , { tag: "footer",     html: D.footer {} [] }
      , { tag: "form",       html: D.form {} [] }
      , { tag: "h1",         html: D.h1 {} [] }
      , { tag: "h2",         html: D.h2 {} [] }
      , { tag: "h3",         html: D.h3 {} [] }
      , { tag: "h4",         html: D.h4 {} [] }
      , { tag: "h5",         html: D.h5 {} [] }
      , { tag: "h6",         html: D.h6 {} [] }
      , { tag: "head",       html: D.head_ {} [] }
      , { tag: "header",     html: D.header {} [] }
      , { tag: "hgroup",     html: D.hgroup {} [] }
      , { tag: "html",       html: D.html {} [] }
      , { tag: "i",          html: D.i {} [] }
      , { tag: "iframe",     html: D.iframe {} [] }
      , { tag: "ins",        html: D.ins {} [] }
      , { tag: "kbd",        html: D.kbd {} [] }
      , { tag: "label",      html: D.label {} [] }
      , { tag: "legend",     html: D.legend {} [] }
      , { tag: "li",         html: D.li {} [] }
      , { tag: "main",       html: D.main {} [] }
      , { tag: "map",        html: D.map_ {} [] }
      , { tag: "mark",       html: D.mark {} [] }
      , { tag: "math",       html: D.math {} [] }
      , { tag: "menu",       html: D.menu {} [] }
      , { tag: "meter",      html: D.meter {} [] }
      , { tag: "nav",        html: D.nav {} [] }
      , { tag: "noscript",   html: D.noscript {} [] }
      , { tag: "object",     html: D.object {} [] }
      , { tag: "ol",         html: D.ol {} [] }
      , { tag: "optgroup",   html: D.optgroup {} [] }
      , { tag: "option",     html: D.option {} [] }
      , { tag: "output",     html: D.output {} [] }
      , { tag: "p",          html: D.p {} [] }
      , { tag: "picture",    html: D.picture {} [] }
      , { tag: "pre",        html: D.pre {} [] }
      , { tag: "progress",   html: D.progress {} [] }
      , { tag: "q",          html: D.q {} [] }
      , { tag: "rp",         html: D.rp {} [] }
      , { tag: "rt",         html: D.rt {} [] }
      , { tag: "ruby",       html: D.ruby {} [] }
      , { tag: "s",          html: D.s {} [] }
      , { tag: "samp",       html: D.samp {} [] }
      , { tag: "script",     html: D.script {} [] }
      , { tag: "search",     html: D.search {} [] }
      , { tag: "section",    html: D.section {} [] }
      , { tag: "select",     html: D.select {} [] }
      , { tag: "slot",       html: D.slot {} [] }
      , { tag: "small",      html: D.small {} [] }
      , { tag: "span",       html: D.span {} [] }
      , { tag: "strong",     html: D.strong {} [] }
      , { tag: "style",      html: D.style {} [] }
      , { tag: "sub",        html: D.sub {} [] }
      , { tag: "summary",    html: D.summary {} [] }
      , { tag: "sup",        html: D.sup {} [] }
      , { tag: "svg",        html: D.svg {} [] }
      , { tag: "table",      html: D.table {} [] }
      , { tag: "tbody",      html: D.tbody {} [] }
      , { tag: "td",         html: D.td {} [] }
      , { tag: "template",   html: D.template {} [] }
      , { tag: "textarea",   html: D.textarea {} [] }
      , { tag: "tfoot",      html: D.tfoot {} [] }
      , { tag: "th",         html: D.th {} [] }
      , { tag: "thead",      html: D.thead {} [] }
      , { tag: "time",       html: D.time {} [] }
      , { tag: "title",      html: D.title {} [] }
      , { tag: "tr",         html: D.tr {} [] }
      , { tag: "u",          html: D.u {} [] }
      , { tag: "ul",         html: D.ul {} [] }
      , { tag: "var",        html: D.var {} [] }
      , { tag: "video",      html: D.video {} [] }
      ]
  for_ elements \entry ->
    assertElementShape ("DSL container " <> entry.tag) entry.html
      { tag: entry.tag, attrs: [], childCount: 0 }

dslVoidElementsAllCovered :: Effect Unit
dslVoidElementsAllCovered = do
  let
    voids :: Array { tag :: String, html :: Html.Html String }
    voids =
      [ { tag: "area",  html: D.area {} }
      , { tag: "base",  html: D.base {} }
      , { tag: "br",    html: D.br {} }
      , { tag: "col",   html: D.col {} }
      , { tag: "embed", html: D.embed {} }
      , { tag: "hr",    html: D.hr {} }
      , { tag: "img",   html: D.img {} }
      , { tag: "input", html: D.input {} }
      , { tag: "link",  html: D.link {} }
      , { tag: "meta",  html: D.meta {} }
      , { tag: "source", html: D.source {} }
      , { tag: "track", html: D.track {} }
      , { tag: "wbr",   html: D.wbr {} }
      ]
  for_ voids \entry ->
    assertElementShape ("DSL void " <> entry.tag) entry.html
      { tag: entry.tag, attrs: [], childCount: 0 }

dslStringAttributesMapToCorrectNames :: Effect Unit
dslStringAttributesMapToCorrectNames = do
  -- className → class (HTML attribute name differs from record field name)
  assertElementShape "className"
    (D.div { className: "card" } [] :: Html.Html String)
    { tag: "div", attrs: [ "class=card" ], childCount: 0 }
  assertElementShape "id"
    (D.div { id: "main" } [] :: Html.Html String)
    { tag: "div", attrs: [ "id=main" ], childCount: 0 }
  assertElementShape "style"
    (D.div { style: "color:red" } [] :: Html.Html String)
    { tag: "div", attrs: [ "style=color:red" ], childCount: 0 }
  assertElementShape "role"
    (D.nav { role: "navigation" } [] :: Html.Html String)
    { tag: "nav", attrs: [ "role=navigation" ], childCount: 0 }
  assertElementShape "href"
    (D.a { href: "/about" } [] :: Html.Html String)
    { tag: "a", attrs: [ "href=/about" ], childCount: 0 }
  assertElementShape "type_ → type"
    (D.input { type_: "text" } :: Html.Html String)
    { tag: "input", attrs: [ "type=text" ], childCount: 0 }
  assertElementShape "htmlFor → for"
    (D.label { htmlFor: "email" } [] :: Html.Html String)
    { tag: "label", attrs: [ "for=email" ], childCount: 0 }
  assertElementShape "encType → enctype"
    (D.form { encType: "multipart/form-data" } [] :: Html.Html String)
    { tag: "form", attrs: [ "enctype=multipart/form-data" ], childCount: 0 }
  assertElementShape "httpEquiv → http-equiv"
    (D.meta { httpEquiv: "refresh" } :: Html.Html String)
    { tag: "meta", attrs: [ "http-equiv=refresh" ], childCount: 0 }
  assertElementShape "srcSet → srcset"
    (D.img { srcSet: "/img.png 1x" } :: Html.Html String)
    { tag: "img", attrs: [ "srcset=/img.png 1x" ], childCount: 0 }
  assertElementShape "acceptCharset → accept-charset"
    (D.form { acceptCharset: "utf-8" } [] :: Html.Html String)
    { tag: "form", attrs: [ "accept-charset=utf-8" ], childCount: 0 }
  assertElementShape "ariaLabel → aria-label"
    (D.button { ariaLabel: "Close" } [] :: Html.Html String)
    { tag: "button", attrs: [ "aria-label=Close" ], childCount: 0 }
  assertElementShape "ariaLabelledBy → aria-labelledby"
    (D.section { ariaLabelledBy: "heading" } [] :: Html.Html String)
    { tag: "section", attrs: [ "aria-labelledby=heading" ], childCount: 0 }
  assertElementShape "referrerPolicy → referrerpolicy"
    (D.a { referrerPolicy: "no-referrer" } [] :: Html.Html String)
    { tag: "a", attrs: [ "referrerpolicy=no-referrer" ], childCount: 0 }

dslBooleanAttributesRespectTrueFalse :: Effect Unit
dslBooleanAttributesRespectTrueFalse = do
  assertElementShape "disabled true → present"
    (D.button { disabled: true } [] :: Html.Html String)
    { tag: "button", attrs: [ "disabled=disabled" ], childCount: 0 }
  assertElementShape "disabled false → omitted"
    (D.button { disabled: false } [] :: Html.Html String)
    { tag: "button", attrs: [], childCount: 0 }
  assertElementShape "checked true"
    (D.input { checked: true } :: Html.Html String)
    { tag: "input", attrs: [ "checked=checked" ], childCount: 0 }
  assertElementShape "checked false omitted"
    (D.input { checked: false } :: Html.Html String)
    { tag: "input", attrs: [], childCount: 0 }
  assertElementShape "required true"
    (D.input { required: true } :: Html.Html String)
    { tag: "input", attrs: [ "required=required" ], childCount: 0 }
  assertElementShape "readOnly → readonly"
    (D.input { readOnly: true } :: Html.Html String)
    { tag: "input", attrs: [ "readonly=readonly" ], childCount: 0 }
  assertElementShape "autoFocus → autofocus"
    (D.input { autoFocus: true } :: Html.Html String)
    { tag: "input", attrs: [ "autofocus=autofocus" ], childCount: 0 }
  assertElementShape "noValidate → novalidate"
    (D.form { noValidate: true } [] :: Html.Html String)
    { tag: "form", attrs: [ "novalidate=novalidate" ], childCount: 0 }
  assertElementShape "open"
    (D.details { open: true } [] :: Html.Html String)
    { tag: "details", attrs: [ "open=open" ], childCount: 0 }
  assertElementShape "muted"
    (D.video { muted: true } [] :: Html.Html String)
    { tag: "video", attrs: [ "muted=muted" ], childCount: 0 }
  assertElementShape "playsInline → playsinline"
    (D.video { playsInline: true } [] :: Html.Html String)
    { tag: "video", attrs: [ "playsinline=playsinline" ], childCount: 0 }
  assertElementShape "async"
    (D.script { async: true } [] :: Html.Html String)
    { tag: "script", attrs: [ "async=async" ], childCount: 0 }

dslAriaBooleanAttributesAlwaysEmit :: Effect Unit
dslAriaBooleanAttributesAlwaysEmit = do
  -- aria-* booleans render literal "true"/"false" rather than presence
  assertElementShape "ariaHidden true"
    (D.div { ariaHidden: true } [] :: Html.Html String)
    { tag: "div", attrs: [ "aria-hidden=true" ], childCount: 0 }
  assertElementShape "ariaHidden false"
    (D.div { ariaHidden: false } [] :: Html.Html String)
    { tag: "div", attrs: [ "aria-hidden=false" ], childCount: 0 }
  assertElementShape "ariaExpanded false"
    (D.button { ariaExpanded: false } [] :: Html.Html String)
    { tag: "button", attrs: [ "aria-expanded=false" ], childCount: 0 }
  assertElementShape "ariaSelected true"
    (D.option { ariaSelected: true } [] :: Html.Html String)
    { tag: "option", attrs: [ "aria-selected=true" ], childCount: 0 }
  assertElementShape "contentEditable false"
    (D.div { contentEditable: false } [] :: Html.Html String)
    { tag: "div", attrs: [ "contenteditable=false" ], childCount: 0 }

dslIntegerAttributesAreStringified :: Effect Unit
dslIntegerAttributesAreStringified = do
  assertElementShape "tabIndex Int → string"
    (D.button { tabIndex: 3 } [] :: Html.Html String)
    { tag: "button", attrs: [ "tabindex=3" ], childCount: 0 }
  assertElementShape "colSpan Int → colspan string"
    (D.td { colSpan: 2 } [] :: Html.Html String)
    { tag: "td", attrs: [ "colspan=2" ], childCount: 0 }
  assertElementShape "rowSpan Int"
    (D.td { rowSpan: 4 } [] :: Html.Html String)
    { tag: "td", attrs: [ "rowspan=4" ], childCount: 0 }
  assertElementShape "rows Int"
    (D.textarea { rows: 5 } [] :: Html.Html String)
    { tag: "textarea", attrs: [ "rows=5" ], childCount: 0 }
  assertElementShape "cols Int"
    (D.textarea { cols: 40 } [] :: Html.Html String)
    { tag: "textarea", attrs: [ "cols=40" ], childCount: 0 }
  assertElementShape "maxLength Int → maxlength"
    (D.input { maxLength: 100 } :: Html.Html String)
    { tag: "input", attrs: [ "maxlength=100" ], childCount: 0 }
  assertElementShape "width Int"
    (D.img { width: 320 } :: Html.Html String)
    { tag: "img", attrs: [ "width=320" ], childCount: 0 }
  assertElementShape "width String"
    (D.img { width: "100%" } :: Html.Html String)
    { tag: "img", attrs: [ "width=100%" ], childCount: 0 }
  assertElementShape "min Int + max Int + step Int"
    (D.input { min: 0, max: 10, step: 2 } :: Html.Html String)
    { tag: "input", attrs: [ "min=0", "max=10", "step=2" ], childCount: 0 }

dslOnClickPreservesMessage :: Effect Unit
dslOnClickPreservesMessage = do
  let html = D.button { onClick: "submit" } [ D.text "Save" ]
  case htmlAttrs html of
    [ Html.OnClick m ] ->
      assertEqual "onClick carries message verbatim" "submit" m
    _ ->
      failTest "Expected single OnClick attribute"

dslMultipleAttributesCompose :: Effect Unit
dslMultipleAttributesCompose = do
  let html =
        D.button
          { className: "btn primary"
          , id: "submit-btn"
          , disabled: false
          , type_: "submit"
          , onClick: "send"
          }
          [ D.text "Send" ]
  assertElementShape "multiple attrs, disabled=false omitted"
    html
    { tag: "button"
    , attrs: [ "class=btn primary", "id=submit-btn", "type=submit", "click:\"send\"" ]
    , childCount: 1
    }

dslEmptyRecordYieldsNoAttributes :: Effect Unit
dslEmptyRecordYieldsNoAttributes = do
  assertElementShape "div with empty attrs/children"
    (D.div {} [] :: Html.Html String)
    { tag: "div", attrs: [], childCount: 0 }
  assertElementShape "p with empty attrs but with child"
    (D.p {} [ D.text "hi" ] :: Html.Html String)
    { tag: "p", attrs: [], childCount: 1 }

dslVoidElementProducesNoChildren :: Effect Unit
dslVoidElementProducesNoChildren = do
  -- The type forbids passing children to void elements (compile-time guarantee).
  -- At the value level, the resulting Element has zero children.
  assertElementShape "img void"
    (D.img { src: "/x.png", alt: "x" } :: Html.Html String)
    { tag: "img", attrs: [ "src=/x.png", "alt=x" ], childCount: 0 }
  assertElementShape "input void"
    (D.input { type_: "checkbox", checked: true } :: Html.Html String)
    { tag: "input", attrs: [ "type=checkbox", "checked=checked" ], childCount: 0 }
  assertElementShape "hr void"
    (D.hr {} :: Html.Html String)
    { tag: "hr", attrs: [], childCount: 0 }

dslDeepNestingPreservesStructure :: Effect Unit
dslDeepNestingPreservesStructure = do
  let
    page =
      D.div { className: "app" }
        [ D.header { className: "nav" }
            [ D.a { href: "/", className: "logo" } [ D.text "Home" ]
            , D.ul { className: "links" }
                [ D.li {} [ D.a { href: "/about" } [ D.text "About" ] ]
                , D.li {} [ D.a { href: "/contact" } [ D.text "Contact" ] ]
                ]
            ]
        , D.main {}
            [ D.section { className: "hero" }
                [ D.h1 { className: "title" } [ D.text "Welcome" ]
                , D.p { className: "lead" } [ D.text "Subtitle" ]
                , D.button { className: "cta", onClick: "start" }
                    [ D.text "Get started" ]
                ]
            ]
        ]
  assertEqual
    "deeply nested DSL serialises identically to manual H.Element tree"
    "div[class=app]{header[class=nav]{a[class=logo,href=/]{text(Home)}|ul[class=links]{li[]{a[href=/about]{text(About)}}|li[]{a[href=/contact]{text(Contact)}}}}|main[]{section[class=hero]{h1[class=title]{text(Welcome)}|p[class=lead]{text(Subtitle)}|button[class=cta,click:\"start\"]{text(Get started)}}}}"
    (serializeHtml page)

dslInteropWithExistingHtmlHelpers :: Effect Unit
dslInteropWithExistingHtmlHelpers = do
  let
    mixed :: Html.Html String
    mixed =
      D.div { className: "wrap" }
        [ Html.div [ Html.className "inner" ] [ Html.text "from H" ]
        , D.span { id: "marker" } [ D.text "from D" ]
        ]
  assertEqual
    "DSL and existing Array-based API produce the same ADT"
    "div[class=wrap]{div[class=inner]{text(from H)}|span[id=marker]{text(from D)}}"
    (serializeHtml mixed)

data CounterMsg
  = Plus
  | Minus

derive instance eqCounterMsg :: Eq CounterMsg

instance showCounterMsg :: Show CounterMsg where
  show Plus = "Plus"
  show Minus = "Minus"

dslCustomMsgTypePropagatesAcrossNesting :: Effect Unit
dslCustomMsgTypePropagatesAcrossNesting = do
  let
    page :: Html.Html CounterMsg
    page =
      D.div { className: "counter" }
        [ D.button { onClick: Plus } [ D.text "+" ]
        , D.button { onClick: Minus, disabled: false } [ D.text "-" ]
        , D.span {} [ D.text "value" ]
        ]
  assertEqual
    "Custom Msg ADT flows through nested DSL constructors"
    "div[class=counter]{button[click:Plus]{text(+)}|button[click:Minus]{text(-)}|span[]{text(value)}}"
    (serializeHtml page)

dslLinkAttributesAllSupported :: Effect Unit
dslLinkAttributesAllSupported = do
  assertElementShape "link a — all link-family attrs"
    ( D.a
        { href: "/about"
        , target: "_blank"
        , rel: "noopener"
        , download: "doc.pdf"
        , hrefLang: "en"
        , ping: "/track"
        , referrerPolicy: "no-referrer"
        }
        [] :: Html.Html String
    )
    { tag: "a"
    , attrs:
        [ "href=/about"
        , "target=_blank"
        , "rel=noopener"
        , "download=doc.pdf"
        , "hreflang=en"
        , "ping=/track"
        , "referrerpolicy=no-referrer"
        ]
    , childCount: 0
    }

dslMediaAttributesAllSupported :: Effect Unit
dslMediaAttributesAllSupported = do
  assertElementShape "img — full media attr set"
    ( D.img
        { src: "/x.png"
        , alt: "x"
        , srcSet: "/x.png 1x, /x2.png 2x"
        , sizes: "(max-width: 600px) 480px, 800px"
        , crossOrigin: "anonymous"
        , loading: "lazy"
        , decoding: "async"
        , width: 320
        , height: 240
        } :: Html.Html String
    )
    { tag: "img"
    , attrs:
        [ "src=/x.png"
        , "alt=x"
        , "srcset=/x.png 1x, /x2.png 2x"
        , "sizes=(max-width: 600px) 480px, 800px"
        , "crossorigin=anonymous"
        , "loading=lazy"
        , "decoding=async"
        , "width=320"
        , "height=240"
        ]
    , childCount: 0
    }
  assertElementShape "video — playback flags"
    ( D.video
        { controls: true
        , autoPlay: false
        , loop: true
        , muted: true
        , playsInline: true
        , poster: "/p.png"
        , preload: "metadata"
        }
        [] :: Html.Html String
    )
    { tag: "video"
    , attrs:
        [ "controls=controls"
        , "loop=loop"
        , "muted=muted"
        , "playsinline=playsinline"
        , "poster=/p.png"
        , "preload=metadata"
        ]
    , childCount: 0
    }
  assertElementShape "track — kind/srclang/label"
    ( D.track { kind: "subtitles", srcLang: "pl", label: "Polski", src: "/p.vtt" } :: Html.Html String )
    { tag: "track"
    , attrs:
        [ "kind=subtitles"
        , "srclang=pl"
        , "label=Polski"
        , "src=/p.vtt"
        ]
    , childCount: 0
    }

dslFormAttributesAllSupported :: Effect Unit
dslFormAttributesAllSupported = do
  assertElementShape "form attrs"
    ( D.form
        { action: "/submit"
        , method: "post"
        , encType: "multipart/form-data"
        , acceptCharset: "utf-8"
        , noValidate: true
        , autoComplete: "off"
        }
        [] :: Html.Html String
    )
    { tag: "form"
    , attrs:
        [ "action=/submit"
        , "method=post"
        , "enctype=multipart/form-data"
        , "accept-charset=utf-8"
        , "novalidate=novalidate"
        , "autocomplete=off"
        ]
    , childCount: 0
    }
  assertElementShape "input attrs"
    ( D.input
        { type_: "email"
        , name: "email"
        , value: "a@b"
        , placeholder: "you@example.com"
        , required: true
        , autoFocus: true
        , readOnly: false
        , inputMode: "email"
        , pattern: ".+@.+"
        , accept: ".eml"
        , maxLength: 254
        , minLength: 3
        , size: 30
        , autoCapitalize: "none"
        , list: "saved-emails"
        } :: Html.Html String
    )
    { tag: "input"
    , attrs:
        [ "type=email"
        , "name=email"
        , "value=a@b"
        , "placeholder=you@example.com"
        , "required=required"
        , "autofocus=autofocus"
        , "inputmode=email"
        , "pattern=.+@.+"
        , "accept=.eml"
        , "maxlength=254"
        , "minlength=3"
        , "size=30"
        , "autocapitalize=none"
        , "list=saved-emails"
        ]
    , childCount: 0
    }
  assertElementShape "button form-* attrs"
    ( D.button
        { form: "outerForm"
        , formAction: "/save"
        , formMethod: "post"
        , formEncType: "application/x-www-form-urlencoded"
        , formTarget: "_self"
        , formNoValidate: true
        }
        [] :: Html.Html String
    )
    { tag: "button"
    , attrs:
        [ "form=outerForm"
        , "formaction=/save"
        , "formmethod=post"
        , "formenctype=application/x-www-form-urlencoded"
        , "formtarget=_self"
        , "formnovalidate=formnovalidate"
        ]
    , childCount: 0
    }

dslAriaAttributesStringFamily :: Effect Unit
dslAriaAttributesStringFamily = do
  assertElementShape "aria-* string attrs"
    ( D.div
        { ariaLabel: "Close dialog"
        , ariaLabelledBy: "title"
        , ariaDescribedBy: "desc"
        , ariaControls: "menu"
        , ariaCurrent: "page"
        , ariaLive: "polite"
        , role: "button"
        }
        [] :: Html.Html String
    )
    { tag: "div"
    , attrs:
        [ "aria-label=Close dialog"
        , "aria-labelledby=title"
        , "aria-describedby=desc"
        , "aria-controls=menu"
        , "aria-current=page"
        , "aria-live=polite"
        , "role=button"
        ]
    , childCount: 0
    }
  assertElementShape "aria-* boolean family — true side"
    ( D.button
        { ariaPressed: true
        , ariaExpanded: true
        , ariaSelected: true
        , ariaDisabled: true
        , ariaHidden: true
        }
        [] :: Html.Html String
    )
    { tag: "button"
    , attrs:
        [ "aria-pressed=true"
        , "aria-expanded=true"
        , "aria-selected=true"
        , "aria-disabled=true"
        , "aria-hidden=true"
        ]
    , childCount: 0
    }

dslMetaAndScriptAttributesSupported :: Effect Unit
dslMetaAndScriptAttributesSupported = do
  assertElementShape "meta — charset/content/http-equiv"
    ( D.meta
        { charset: "utf-8"
        , content: "width=device-width, initial-scale=1"
        , httpEquiv: "X-UA-Compatible"
        } :: Html.Html String
    )
    { tag: "meta"
    , attrs:
        [ "charset=utf-8"
        , "content=width=device-width, initial-scale=1"
        , "http-equiv=X-UA-Compatible"
        ]
    , childCount: 0
    }
  assertElementShape "script — async/defer/type/src"
    ( D.script
        { src: "/app.js"
        , type_: "module"
        , async: true
        , defer: false
        }
        [] :: Html.Html String
    )
    { tag: "script"
    , attrs:
        [ "src=/app.js"
        , "type=module"
        , "async=async"
        ]
    , childCount: 0
    }
  assertElementShape "link rel/href/type"
    ( D.link
        { rel: "stylesheet"
        , href: "/x.css"
        , type_: "text/css"
        } :: Html.Html String
    )
    { tag: "link"
    , attrs:
        [ "rel=stylesheet"
        , "href=/x.css"
        , "type=text/css"
        ]
    , childCount: 0
    }

dslTableAttributesSupported :: Effect Unit
dslTableAttributesSupported = do
  assertElementShape "td colspan/rowspan/headers/scope"
    ( D.td
        { colSpan: 2
        , rowSpan: 3
        , headers: "h1 h2"
        , scope: "col"
        }
        [] :: Html.Html String
    )
    { tag: "td"
    , attrs:
        [ "colspan=2"
        , "rowspan=3"
        , "headers=h1 h2"
        , "scope=col"
        ]
    , childCount: 0
    }
  assertElementShape "col — spanCount → span"
    ( D.col { spanCount: 4 } :: Html.Html String )
    { tag: "col"
    , attrs: [ "span=4" ]
    , childCount: 0
    }

dslGlobalAttributesSupported :: Effect Unit
dslGlobalAttributesSupported = do
  assertElementShape "global attrs (accesskey, enterkeyhint, popover, nonce, is, inert true)"
    ( D.div
        { accessKey: "k"
        , enterKeyHint: "send"
        , popover: "auto"
        , nonce: "abc"
        , is: "my-tag"
        , inert: true
        , lang: "pl"
        , dir: "ltr"
        }
        [] :: Html.Html String
    )
    { tag: "div"
    , attrs:
        [ "accesskey=k"
        , "enterkeyhint=send"
        , "popover=auto"
        , "nonce=abc"
        , "is=my-tag"
        , "inert=inert"
        , "lang=pl"
        , "dir=ltr"
        ]
    , childCount: 0
    }
  assertElementShape "inert false omits"
    ( D.div { inert: false } [] :: Html.Html String )
    { tag: "div", attrs: [], childCount: 0 }
  assertElementShape "microdata"
    ( D.div
        { itemProp: "name"
        , itemId: "urn:foo"
        , itemRef: "r1"
        , itemType: "https://schema.org/Person"
        , itemScope: true
        }
        [] :: Html.Html String
    )
    { tag: "div"
    , attrs:
        [ "itemprop=name"
        , "itemid=urn:foo"
        , "itemref=r1"
        , "itemtype=https://schema.org/Person"
        , "itemscope=itemscope"
        ]
    , childCount: 0
    }

dslAriaCompleteCoverage :: Effect Unit
dslAriaCompleteCoverage = do
  assertElementShape "aria string properties (extended)"
    ( D.div
        { ariaActiveDescendant: "node-3"
        , ariaAutoComplete: "list"
        , ariaChecked: "mixed"
        , ariaDetails: "extra"
        , ariaErrorMessage: "err"
        , ariaFlowTo: "next"
        , ariaHasPopup: "menu"
        , ariaInvalid: "spelling"
        , ariaKeyShortcuts: "Alt+S"
        , ariaOrientation: "horizontal"
        , ariaOwns: "child"
        , ariaPlaceholder: "type..."
        , ariaRelevant: "additions text"
        , ariaRoleDescription: "slider"
        , ariaSort: "ascending"
        , ariaValueText: "1 of 10"
        , role: "slider"
        }
        [] :: Html.Html String
    )
    { tag: "div"
    , attrs:
        [ "aria-activedescendant=node-3"
        , "aria-autocomplete=list"
        , "aria-checked=mixed"
        , "aria-details=extra"
        , "aria-errormessage=err"
        , "aria-flowto=next"
        , "aria-haspopup=menu"
        , "aria-invalid=spelling"
        , "aria-keyshortcuts=Alt+S"
        , "aria-orientation=horizontal"
        , "aria-owns=child"
        , "aria-placeholder=type..."
        , "aria-relevant=additions text"
        , "aria-roledescription=slider"
        , "aria-sort=ascending"
        , "aria-valuetext=1 of 10"
        , "role=slider"
        ]
    , childCount: 0
    }
  assertElementShape "aria boolean properties (extended)"
    ( D.div
        { ariaAtomic: true
        , ariaBusy: false
        , ariaModal: true
        , ariaMultiLine: false
        , ariaMultiSelectable: true
        , ariaReadOnly: false
        , ariaRequired: true
        }
        [] :: Html.Html String
    )
    { tag: "div"
    , attrs:
        [ "aria-atomic=true"
        , "aria-busy=false"
        , "aria-modal=true"
        , "aria-multiline=false"
        , "aria-multiselectable=true"
        , "aria-readonly=false"
        , "aria-required=true"
        ]
    , childCount: 0
    }
  assertElementShape "aria integer properties"
    ( D.div
        { ariaLevel: 2
        , ariaColCount: 3
        , ariaColIndex: 1
        , ariaColSpan: 2
        , ariaRowCount: 10
        , ariaRowIndex: 4
        , ariaRowSpan: 1
        , ariaPosInSet: 5
        , ariaSetSize: 20
        , ariaValueMax: 100
        , ariaValueMin: 0
        , ariaValueNow: 50
        }
        [] :: Html.Html String
    )
    { tag: "div"
    , attrs:
        [ "aria-level=2"
        , "aria-colcount=3"
        , "aria-colindex=1"
        , "aria-colspan=2"
        , "aria-rowcount=10"
        , "aria-rowindex=4"
        , "aria-rowspan=1"
        , "aria-posinset=5"
        , "aria-setsize=20"
        , "aria-valuemax=100"
        , "aria-valuemin=0"
        , "aria-valuenow=50"
        ]
    , childCount: 0
    }

dslDataAttrsExpandToMultipleAttributes :: Effect Unit
dslDataAttrsExpandToMultipleAttributes = do
  assertElementShape "dataAttrs list → multiple data-* attributes"
    ( D.div
        { dataAttrs:
            [ D.kv "state" "open"
            , D.kv "test-id" "main-panel"
            , D.kv "row-index" "3"
            ]
        }
        [] :: Html.Html String
    )
    { tag: "div"
    , attrs:
        [ "data-state=open"
        , "data-test-id=main-panel"
        , "data-row-index=3"
        ]
    , childCount: 0
    }
  assertElementShape "empty dataAttrs list produces no attrs"
    ( D.div { dataAttrs: [] :: Array D.KeyValue } [] :: Html.Html String )
    { tag: "div", attrs: [], childCount: 0 }

dslAriaAttrsExpandToMultipleAttributes :: Effect Unit
dslAriaAttrsExpandToMultipleAttributes = do
  assertElementShape "ariaAttrs list → multiple aria-* attributes"
    ( D.div
        { ariaAttrs:
            [ D.kv "label" "Search"
            , D.kv "describedby" "hint"
            , D.kv "controls" "results"
            ]
        }
        [] :: Html.Html String
    )
    { tag: "div"
    , attrs:
        [ "aria-label=Search"
        , "aria-describedby=hint"
        , "aria-controls=results"
        ]
    , childCount: 0
    }

dslGenericAttrsComposeWithSpecificOnes :: Effect Unit
dslGenericAttrsComposeWithSpecificOnes = do
  assertElementShape "specific + generic aria/data attrs side by side"
    ( D.button
        { className: "menu"
        , ariaLabel: "Open"
        , ariaExpanded: false
        , ariaAttrs: [ D.kv "controls" "menu-id" ]
        , dataAttrs: [ D.kv "testid" "open-btn" ]
        , onClick: "toggle"
        }
        [] :: Html.Html String
    )
    { tag: "button"
    , attrs:
        [ "class=menu"
        , "aria-label=Open"
        , "aria-expanded=false"
        , "aria-controls=menu-id"
        , "data-testid=open-btn"
        , "click:\"toggle\""
        ]
    , childCount: 0
    }

dslOnInputCarriesTargetValue :: Effect Unit
dslOnInputCarriesTargetValue = do
  let
    page :: Html.Html String
    page = D.input { type_: "text", onInput: \v -> "input:" <> v }
  case htmlAttrs page of
    [ Html.Attribute "type" "text", Html.OnEvent "input" _ ] ->
      pure unit
    [ Html.OnEvent "input" _, Html.Attribute "type" "text" ] ->
      pure unit
    other ->
      failTest ("Expected onInput + type attrs, got: " <> joinWith "|" (serializeAttribute <$> other))

dslOnChangeCarriesTargetValue :: Effect Unit
dslOnChangeCarriesTargetValue = do
  let
    page :: Html.Html String
    page = D.select { onChange: \v -> "selected:" <> v } []
  assertTrue "select has onChange OnEvent"
    (containsOnEvent "change" (htmlAttrs page))

dslOnSubmitFiresWithoutPayload :: Effect Unit
dslOnSubmitFiresWithoutPayload = do
  let
    page :: Html.Html String
    page = D.form { onSubmit: "submitted" } []
  assertTrue "form has onSubmit OnEvent"
    (containsOnEvent "submit" (htmlAttrs page))

dslOnKeyDownAndOnKeyUpCarryKey :: Effect Unit
dslOnKeyDownAndOnKeyUpCarryKey = do
  let
    page :: Html.Html String
    page =
      D.input
        { onKeyDown: \k -> "down:" <> k
        , onKeyUp: \k -> "up:" <> k
        }
  assertTrue "input has onKeyDown OnEvent" (containsOnEvent "keydown" (htmlAttrs page))
  assertTrue "input has onKeyUp OnEvent" (containsOnEvent "keyup" (htmlAttrs page))

dslOnFocusOnBlurOnDoubleClick :: Effect Unit
dslOnFocusOnBlurOnDoubleClick = do
  let
    page :: Html.Html String
    page =
      D.input
        { onFocus: "f"
        , onBlur: "b"
        , onDoubleClick: "dbl"
        }
  assertTrue "onFocus event" (containsOnEvent "focus" (htmlAttrs page))
  assertTrue "onBlur event" (containsOnEvent "blur" (htmlAttrs page))
  assertTrue "onDoubleClick event" (containsOnEvent "dblclick" (htmlAttrs page))

dslOnMouseEnterOnMouseLeave :: Effect Unit
dslOnMouseEnterOnMouseLeave = do
  let
    page :: Html.Html String
    page =
      D.div
        { onMouseEnter: "enter"
        , onMouseLeave: "leave"
        }
        []
  assertTrue "onMouseEnter event" (containsOnEvent "mouseenter" (htmlAttrs page))
  assertTrue "onMouseLeave event" (containsOnEvent "mouseleave" (htmlAttrs page))

dslMultipleEventsOnOneElement :: Effect Unit
dslMultipleEventsOnOneElement = do
  let
    page :: Html.Html String
    page =
      D.button
        { onClick: "c"
        , onFocus: "f"
        , onBlur: "b"
        , className: "btn"
        }
        []
  -- One legacy OnClick + two OnEvent attrs + one Attribute
  let attrs = htmlAttrs page
  assertEqual "attrs count" 4 (length attrs)
  assertTrue "has class" (any (\a -> serializeAttribute a == "class=btn") attrs)
  assertTrue "has onClick" (any isOnClick attrs)
  assertTrue "has onFocus" (containsOnEvent "focus" attrs)
  assertTrue "has onBlur" (containsOnEvent "blur" attrs)

containsOnEvent :: forall msg. String -> Array (Html.Attribute msg) -> Boolean
containsOnEvent name attrs =
  any matches attrs
  where
  matches attr = case attr of
    Html.OnEvent n _ -> n == name
    _ -> false

isOnClick :: forall msg. Html.Attribute msg -> Boolean
isOnClick attr = case attr of
  Html.OnClick _ -> true
  _ -> false

----------------------------------------------------------------------
-- README cookbook recipes — these tests exist so the snippets in the
-- HTML DSL cookbook keep compiling. They mirror the patterns shown in
-- README's "Cookbook" section.
----------------------------------------------------------------------

-- Conditional render — `catMaybes` pattern.
cookbookConditionalRender :: Effect Unit
cookbookConditionalRender = do
  let
    page :: Boolean -> Html.Html String
    page loggedIn =
      D.div { className: "page" }
        ( Data.Array.catMaybes
            [ Just (D.h1 {} [ D.text "Dashboard" ])
            , if loggedIn
                then Just (D.button { onClick: "logout" } [ D.text "Sign out" ])
                else Nothing
            , Just (D.section {} [ D.text "Content" ])
            ]
        )

  assertEqual "logged out — sign-out button omitted"
    "div[class=page]{h1[]{text(Dashboard)}|section[]{text(Content)}}"
    (serializeHtml (page false))

  assertEqual "logged in — sign-out button present"
    "div[class=page]{h1[]{text(Dashboard)}|button[click:\"logout\"]{text(Sign out)}|section[]{text(Content)}}"
    (serializeHtml (page true))

-- Lists of items — plain `map`.
cookbookListOfItems :: Effect Unit
cookbookListOfItems = do
  let
    todos = [ "wash car", "buy bread", "read book" ]
    list :: Html.Html String
    list =
      D.ul { className: "stack" }
        (map (\todo -> D.li { className: "row" } [ D.text todo ]) todos)

  assertEqual "list renders one li per todo"
    "ul[class=stack]{li[class=row]{text(wash car)}|li[class=row]{text(buy bread)}|li[class=row]{text(read book)}}"
    (serializeHtml list)

-- Conditional className — the `classes` helper pattern.
cookbookConditionalClassName :: Effect Unit
cookbookConditionalClassName = do
  let
    classes :: Array (Maybe String) -> String
    classes parts = joinWith " " (Data.Array.catMaybes parts)

    button :: { primary :: Boolean, disabled :: Boolean } -> Html.Html String
    button m =
      D.button
        { className:
            classes
              [ Just "btn"
              , if m.primary then Just "btn-primary" else Nothing
              , if m.disabled then Just "opacity-50" else Nothing
              ]
        , disabled: m.disabled
        }
        [ D.text "Submit" ]

  assertEqual "neutral button class"
    "button[class=btn]{text(Submit)}"
    (serializeHtml (button { primary: false, disabled: false }))

  assertEqual "primary disabled — joined class plus disabled attr"
    "button[class=btn btn-primary opacity-50,disabled=disabled]{text(Submit)}"
    (serializeHtml (button { primary: true, disabled: true }))

-- Custom elements via D.element / D.voidElement.
keyedHtmlBuildsExpectedShape :: Effect Unit
keyedHtmlBuildsExpectedShape = do
  let
    tree :: Html.Html String
    tree =
      Html.keyed "ul"
        [ Html.className "todos" ]
        [ Tuple "todo-1" (Html.li [] [ Html.text "A" ])
        , Tuple "todo-2" (Html.li [] [ Html.text "B" ])
        ]

  assertEqual "Html.keyed serialises with the * marker and key=>child pairs"
    "ul[*class=todos]{todo-1=>li[]{text(A)}|todo-2=>li[]{text(B)}}"
    (serializeHtml tree)

keyedDslAppliesAttributeMapping :: Effect Unit
keyedDslAppliesAttributeMapping = do
  let
    tree :: Html.Html String
    tree =
      D.keyed "ol"
        { className: "ranked", id: "leaderboard" }
        [ Tuple "row-1" (D.li {} [ D.text "first" ])
        ]

  assertEqual "DSL.keyed runs record attrs through FromAttrs (className → class)"
    "ol[*class=ranked,id=leaderboard]{row-1=>li[]{text(first)}}"
    (serializeHtml tree)

keyedFunctorMapTraversesChildren :: Effect Unit
keyedFunctorMapTraversesChildren = do
  let
    tree :: Html.Html Int
    tree =
      Html.keyed "ul" []
        [ Tuple "a" (Html.button [ Html.onClick 1 ] [ Html.text "tap" ])
        , Tuple "b" (Html.button [ Html.onClick 2 ] [ Html.text "tap" ])
        ]
    lifted :: Html.Html String
    lifted = map show tree

  assertEqual "Functor.map lifts message types inside keyed children"
    "ul[*]{a=>button[click:\"1\"]{text(tap)}|b=>button[click:\"2\"]{text(tap)}}"
    (serializeHtml lifted)

keyedEmptyChildrenProduceEmptyBody :: Effect Unit
keyedEmptyChildrenProduceEmptyBody = do
  let
    tree :: Html.Html String
    tree = D.keyed "ul" { className: "empty" } []

  assertEqual "DSL.keyed with no children serialises with empty body"
    "ul[*class=empty]{}"
    (serializeHtml tree)

cookbookCustomElement :: Effect Unit
cookbookCustomElement = do
  let
    widget :: Html.Html String
    widget =
      D.element "my-counter"
        { className: "live" }
        [ D.text "8" ]

  assertEqual "custom element tag passes through"
    "my-counter[class=live]{text(8)}"
    (serializeHtml widget)

  let
    spinner :: Html.Html String
    spinner = D.voidElement "my-spinner" { className: "loading" }

  assertEqual "custom void element has no children"
    "my-spinner[class=loading]{}"
    (serializeHtml spinner)

dslIntegerAndStringOverloadsCoexist :: Effect Unit
dslIntegerAndStringOverloadsCoexist = do
  -- width, height, min, max, step, start, tabIndex all accept Int or String
  assertElementShape "width Int"
    (D.img { width: 100 } :: Html.Html String)
    { tag: "img", attrs: [ "width=100" ], childCount: 0 }
  assertElementShape "width String"
    (D.img { width: "50%" } :: Html.Html String)
    { tag: "img", attrs: [ "width=50%" ], childCount: 0 }
  assertElementShape "height Int / String mixed elements"
    (D.video { height: 480 } [] :: Html.Html String)
    { tag: "video", attrs: [ "height=480" ], childCount: 0 }
  assertElementShape "tabIndex Int"
    (D.div { tabIndex: 0 } [] :: Html.Html String)
    { tag: "div", attrs: [ "tabindex=0" ], childCount: 0 }
  assertElementShape "tabIndex String"
    (D.div { tabIndex: "-1" } [] :: Html.Html String)
    { tag: "div", attrs: [ "tabindex=-1" ], childCount: 0 }
  assertElementShape "start Int"
    (D.ol { start: 5 } [] :: Html.Html String)
    { tag: "ol", attrs: [ "start=5" ], childCount: 0 }
