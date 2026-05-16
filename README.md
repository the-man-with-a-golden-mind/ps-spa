![ps-spa logo](logo.png)

`ps-spa` is a PureScript library for file-based SPAs, with a bundled CLI that recreates the `elm-spa` workflow:

- file-based routing from `src/Pages`
- a TEA-style page model with `static`, `sandbox`, `element`, and `advanced` page kinds
- route guards via `protect`
- generated route and page registries
- shared state handled by the runtime/app config
- zero npm dependencies for the CLI and code generator
- example apps that run with normal frontend scripts like `npm run dev` and `bun run dev`

The most useful supporting docs are:

- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [AI Usage Guide](docs/ai-usage.md)
- [Agent Instructions](AGENTS.md)
- [Publishing Readiness](docs/publishing.md)

This repository currently contains:

- the PureScript library in [`src/PsSpa`](src/PsSpa)
- a zero-dependency Node CLI in [`scripts/ps-spa.mjs`](scripts/ps-spa.mjs)
- route/codegen tests in [`tests-js`](tests-js)
- an Elm SPA feature analysis in [`docs/elm-spa-analysis.md`](docs/elm-spa-analysis.md)
- generated example apps in [`examples/basic`](examples/basic) and [`examples/tailwind`](examples/tailwind)

## Repo Layout

There are two different layers in this repo:

- [`src/PsSpa`](src/PsSpa) is the framework core
- [`examples/basic/src/Main.purs`](examples/basic/src/Main.purs), [`examples/basic/src/Pages`](examples/basic/src/Pages), and [`examples/basic/src/Generated`](examples/basic/src/Generated) are generated app-level code

`Pages` and `Generated` are app-level folders, not framework-level folders. In consumer apps they should exist. In this repo they live only under `examples/`, so the framework source stays clean.

## Framework Commands

```bash
node scripts/ps-spa.mjs new examples/my-app
node scripts/ps-spa.mjs --root examples/basic add /marketing/hero tailwind
node scripts/ps-spa.mjs --root examples/basic add /users/:name/posts/:id advanced
node scripts/ps-spa.mjs --root examples/basic gen
node scripts/ps-spa.mjs --root examples/basic verify
node scripts/ps-spa.mjs --root examples/basic doctor
npm run test:generated
npm run test:ps
npm run bench
npm run bench:verify
npm run bench:browser
npm run bench:browser:verify
node --test tests-js/**/*.test.mjs
spago build
```

## Running Examples

Each app in [`examples`](examples) is its own project.
Run each example from its own directory, not from the repo root.

Basic example:

```bash
cd examples/basic
bun install
bun run dev
```

Tailwind example:

```bash
cd examples/tailwind
bun install
bun run dev
```

If you prefer npm, use `npm install` and `npm run dev` inside that example directory.

## What matches elm-spa today

- `examples/basic/src/Pages/Index.purs` maps to `/`
- `examples/basic/src/Pages/NotFound.purs` is reserved as the 404 page
- nested folders produce nested routes
- `NameParam.purs` style files produce dynamic path segments like `:name`
- route constructors and `parsePath` / `toPath` are generated into `examples/basic/src/Generated/Route.purs`
- `parseRequest` builds a request record with route, path, query, fragment, and raw `href`
- request helpers now include `queryParam`, `queryParams`, `queryInt`, `queryBoolean`, and `fragmentValue`
- page metadata and route-to-module wiring are generated into `examples/basic/src/Generated/Pages.purs`
- `examples/basic/src/Generated/App.purs` is the default app entrypoint, so userland does not need to wire `Runtime.start` by hand
- `examples/basic/src/Generated/Link.purs` is the default typed navigation surface, so userland does not need raw route strings by default
- the core page API models the four page kinds from Elm SPA
- `element` and `advanced` templates expose `subscriptions` stubs out of the box
- page modules receive a `Request` and can define `protect` guards
- `gen` and `add` maintain generated smoke tests in `examples/basic/tests-generated/`
- `gen` and `add` maintain generated benchmark scenarios in `examples/basic/benchmarks-generated/`
- `gen` and `add` maintain browser benchmark assets in [`examples/basic/public/bench`](examples/basic/public/bench)
- `new` scaffolds a full app root with `spago.dhall`, `Main`, `index.html`, and browser benchmark pages
- `verify` checks for drift in generated PureScript, generated smoke tests, generated benchmarks, and Tailwind scaffold files
- `doctor` reports route counts plus missing/drifting generated artifacts

Because PureScript does not allow Elm-style trailing underscore module names, the generator uses a PureScript-native naming convention that preserves a 1:1 mapping between file path and module name:

- `src/Pages/Index.purs` -> module `Pages.Index` and route constructor `Index`
- `src/Pages/People/NameParam.purs` -> module `Pages.People.NameParam` and route constructor `PeopleNameParam`

## What is still missing

- default ejected shared/auth modules comparable to a mature `elm-spa` app
- richer PureScript-side request/form decoders for larger apps

## Tailwind

Running `node scripts/ps-spa.mjs --root examples/basic add /route tailwind` does two things:

- generates a Tailwind-styled page module (using the [HTML DSL](#html-dsl) below)
- scaffolds `styles/tailwind.css` (with the `@import "tailwindcss"` directive), patches `vite.config.mjs` to register the `@tailwindcss/vite` plugin, and adds `tailwindcss` + `@tailwindcss/vite` to devDependencies

This is Tailwind v4 — there is no `tailwind.config.cjs` / `postcss.config.cjs`; the Vite plugin handles everything.

Generated apps also get a local `package.json`, so the normal way to run them is from inside that app directory:

```bash
cd examples/basic
npm install
npm run dev
```

or:

```bash
cd examples/tailwind
bun install
bun run dev
```

## Runtime

The generated app can be bundled into `public/app.js` and mounted into `#app` using the minimal runtime in [src/PsSpa/Runtime.purs](src/PsSpa/Runtime.purs).

Internal `<a href="/somewhere">` links are intercepted by the SPA runtime, so route changes no longer require a full page reload.

## Reliability

This is still not literally fail-proof. What it has now is a much stronger safety net:

- PureScript framework tests for the core request/effect/html/page APIs in `test/`
- handwritten framework tests in [tests-js](tests-js)
- generated per-page smoke tests in [`examples/basic/tests-generated`](examples/basic/tests-generated)
- real-world codegen and routing benchmarks in [benchmarks](benchmarks)
- generated per-page benchmark scenarios in [`examples/basic/benchmarks-generated`](examples/basic/benchmarks-generated)

`npm run bench` measures the runtime path in Node with a fake DOM harness.

`npm run bench:browser` starts a tiny local server, opens `/bench/`, and waits for the benchmark page to post back real browser results. The browser suite measures actual DOM render cost, rerender cost, and SPA navigation interception. `npm run bench:browser:verify` enforces thresholds from [`benchmarks/browser-thresholds.json`](benchmarks/browser-thresholds.json).

Each benchmark run now also writes JSON history to [`benchmarks/history`](benchmarks/history), and `npm run bench:verify` enforces the thresholds from [`benchmarks/thresholds.json`](benchmarks/thresholds.json).

## Library Status

`ps-spa` is one repo with two publish surfaces:

- the PureScript library package defined by [`spago.yaml`](spago.yaml)
- the npm package that also exposes the `ps-spa` CLI

The CLI exists to scaffold and maintain apps around the library. The repo still ships the PureScript sources through the npm package today, but the package metadata is now aligned for a real library release as well.
See [docs/publishing.md](docs/publishing.md).

## HTML DSL

ps-spa ships two layers for building views; new code should reach for the **record-based DSL** in [src/PsSpa/Html/DSL.purs](src/PsSpa/Html/DSL.purs), which is the style every scaffold template now emits.

```purescript
import PsSpa.Html.DSL as D

view =
  D.main { className: "mx-auto max-w-3xl px-6 py-16" }
    [ D.h1 { className: "text-4xl font-bold" }
        [ D.text "Hello" ]
    , D.p { className: "text-lg text-slate-600" }
        [ D.text "Record attrs, type-safe, plays nice with the rest of PureScript." ]
    , D.button
        { className: "rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        , onClick: Submit
        , disabled: false
        }
        [ D.text "Click me" ]
    ]
```

### What's covered

- **Every standard HTML5 element** — 90 container elements (`a`, `audio`, `blockquote`, `details`, `div`, `dialog`, `figure`, `form`, `header`, `iframe`, `main`, `math`, `nav`, `picture`, `progress`, `section`, `svg`, `table`, `template`, `video`, ...) and 13 void elements (`area`, `base`, `br`, `col`, `embed`, `hr`, `img`, `input`, `link`, `meta`, `source`, `track`, `wbr`). The few PureScript keywords are escaped: `data_`, `head_`, `map_`.
- **Most HTML attributes** — `className`, `id`, `href`, `src`, `srcSet`, `sizes`, `alt`, `type_`, `value`, `placeholder`, `htmlFor`, `encType`, `httpEquiv`, `action`, `method`, `accept`, `acceptCharset`, `inputMode`, `pattern`, `formAction`, `formMethod`, `colSpan`, `rowSpan`, `tabIndex`, `width`, `height`, `min`, `max`, `step`, `maxLength`, `minLength`, … each backed by a typeclass instance that maps the record field to the canonical HTML attribute name.
- **Boolean attributes** — `disabled`, `checked`, `readOnly`, `required`, `autoFocus`, `hidden`, `open`, `controls`, `autoPlay`, `loop`, `muted`, `playsInline`, `async`, `defer`, `multiple`, `noValidate`, `formNoValidate`, `inert`, … pass `true` to emit, `false` to omit.
- **Full ARIA 1.2** — `role`, `ariaLabel`, `ariaLabelledBy`, `ariaDescribedBy`, `ariaControls`, `ariaCurrent`, `ariaLive`, `ariaHidden`, `ariaExpanded`, `ariaSelected`, `ariaPressed`, `ariaDisabled`, `ariaBusy`, `ariaModal`, `ariaInvalid`, `ariaHasPopup`, `ariaLevel`, `ariaSetSize`, `ariaPosInSet`, `ariaValueMin/Max/Now/Text`, `ariaRowCount/Index/Span`, `ariaColCount/Index/Span`, … (string, boolean, and integer flavours).
- **Microdata** — `itemProp`, `itemId`, `itemRef`, `itemType`, `itemScope`.
- **Generic `data-*` and `aria-*`** for the long tail:

  ```purescript
  D.div
    { className: "panel"
    , dataAttrs: [ D.kv "state" "open", D.kv "test-id" "main-panel" ]
    , ariaAttrs: [ D.kv "describedby" "panel-help" ]
    }
    [ ... ]
  ```

- **Events** — `onClick`, `onDoubleClick`, `onSubmit`, `onFocus`, `onBlur`, `onMouseEnter`, `onMouseLeave`, `onInput`, `onChange`, `onKeyDown`, `onKeyUp`. Input-like handlers carry a `String -> msg` (the event target value or key name); others carry just the message:

  ```purescript
  D.form { onSubmit: Submitted }
    [ D.input { type_: "text", onInput: \v -> Updated v, value: model.draft }
    , D.button { type_: "submit" } [ D.text "Save" ]
    ]
  ```

  For anything not in the list above, `PsSpa.Html.onEvent` is the escape hatch:

  ```purescript
  import PsSpa.Html (onEvent)
  import PsSpa.Event (preventDefault)

  -- `D.div { ariaAttrs: [...] }` plus an inline escape via array-style attrs:
  D.div { className: "drop" } [...]
  -- needs a `dragover` listener? drop down to the array API:
  H.div
    [ H.className "drop"
    , onEvent "dragover" (\e -> DroppedOver)
    ]
    [ ... ]
  ```

### Legacy API

The original array-style API in [src/PsSpa/Html.purs](src/PsSpa/Html.purs) still works and continues to compile against existing pages — `D.div { className: "x" }` and `H.div [H.className "x"]` produce the same `Element` ADT, so both can live in the same file. Use the array API as an escape hatch when the DSL doesn't have a specific helper:

```purescript
import PsSpa.Html as H

H.div [ H.attr "data-custom" "anything", H.onClick Submit ]
  [ H.text "Mixed styles fine." ]
```

`Generated.Link` reflects the same split: `Link.link Index { className: "back" }` for the new style, `Link.linkAttrs Index [H.className "back"]` for the legacy one.

### Field → HTML attribute mapping

PureScript record fields can't be reserved keywords (`class`, `type`, `for`, `data`) and follow PS naming (camelCase), so some fields are renamed before reaching the DOM. Most renames just swap camelCase to kebab-case; a few are full keyword escapes:

| Record field          | HTML attribute        | Type     | Notes                              |
| --------------------- | --------------------- | -------- | ---------------------------------- |
| `className`           | `class`               | String   | `class` is reserved                |
| `htmlFor`             | `for`                 | String   | `for` is reserved                  |
| `type_`               | `type`                | String   | `type` is reserved                 |
| `data_` (element)     | `<data>`              | —        | `data` is reserved                 |
| `head_` (element)     | `<head>`              | —        | shadows Prelude.head               |
| `map_` (element)      | `<map>`               | —        | clarity                            |
| `encType`             | `enctype`             | String   |                                    |
| `acceptCharset`       | `accept-charset`      | String   |                                    |
| `hrefLang`            | `hreflang`            | String   |                                    |
| `referrerPolicy`      | `referrerpolicy`      | String   |                                    |
| `srcSet`              | `srcset`              | String   |                                    |
| `srcLang`             | `srclang`             | String   |                                    |
| `crossOrigin`         | `crossorigin`         | String   |                                    |
| `httpEquiv`           | `http-equiv`          | String   |                                    |
| `tabIndex`            | `tabindex`            | Int/Str  | overloaded                         |
| `colSpan` / `rowSpan` | `colspan` / `rowspan` | Int      |                                    |
| `spanCount`           | `span`                | Int      | `<col span="">`; avoids name clash |
| `maxLength`           | `maxlength`           | Int      |                                    |
| `minLength`           | `minlength`           | Int      |                                    |
| `readOnly`            | `readonly`            | Boolean  | omitted when false                 |
| `autoFocus`           | `autofocus`           | Boolean  | omitted when false                 |
| `autoComplete`        | `autocomplete`        | String   |                                    |
| `autoCapitalize`      | `autocapitalize`      | String   |                                    |
| `noValidate`          | `novalidate`          | Boolean  | omitted when false                 |
| `formNoValidate`      | `formnovalidate`      | Boolean  |                                    |
| `formAction`          | `formaction`          | String   |                                    |
| `formMethod`          | `formmethod`          | String   |                                    |
| `formEncType`         | `formenctype`         | String   |                                    |
| `formTarget`          | `formtarget`          | String   |                                    |
| `inputMode`           | `inputmode`           | String   |                                    |
| `autoPlay`            | `autoplay`            | Boolean  | omitted when false                 |
| `playsInline`         | `playsinline`         | Boolean  | omitted when false                 |
| `isMap`               | `ismap`               | Boolean  | omitted when false                 |
| `contentEditable`     | `contenteditable`     | Boolean  | always emits ("true" / "false")    |
| `spellCheck`          | `spellcheck`          | Boolean  | always emits ("true" / "false")    |
| `accessKey`           | `accesskey`           | String   |                                    |
| `enterKeyHint`        | `enterkeyhint`        | String   |                                    |
| `itemScope`           | `itemscope`           | Boolean  | omitted when false                 |
| `itemProp` / `itemId` / `itemRef` / `itemType` | `itemprop` / `itemid` / `itemref` / `itemtype` | String | microdata |
| `ariaLabel`, `ariaLabelledBy`, … | `aria-label`, `aria-labelledby`, … | String/Bool/Int | full ARIA 1.2 set (see [`PsSpa.Html.DSL`](src/PsSpa/Html/DSL.purs)) |
| `dataAttrs`           | many `data-*`         | `Array KeyValue` | expands; one entry per attribute |
| `ariaAttrs`           | many `aria-*`         | `Array KeyValue` | expands                            |
| `onClick`             | (event listener)      | `msg`    | dispatches msg on click            |
| `onInput` / `onChange` / `onKeyDown` / `onKeyUp` | (event listener) | `String -> msg` | carries target.value or key.name |
| `onSubmit` / `onFocus` / `onBlur` / `onDoubleClick` / `onMouseEnter` / `onMouseLeave` | (event listener) | `msg` | |

**Two rules for boolean attributes:**

- Most HTML booleans (`disabled`, `checked`, `required`, …) **omit** when `false`. Pass `true` to emit `<button disabled="disabled">`; pass `false` to render nothing.
- ARIA booleans (`ariaHidden`, `ariaExpanded`, `ariaSelected`, `ariaPressed`, `ariaDisabled`, `ariaBusy`, `ariaModal`, `ariaMultiLine`, `ariaMultiSelectable`, `ariaReadOnly`, `ariaRequired`, `ariaAtomic`) plus `contentEditable`, `spellCheck`, `draggable` **always emit** with literal `"true"` or `"false"` — that's the spec.

### Custom elements (web components)

For tags the DSL doesn't ship — e.g. `<my-counter>` — use the escape hatches:

```purescript
D.element "my-counter" { className: "live" } [ D.text "8" ]
D.voidElement "my-spinner" {}
```

### Custom events

Need an event the DSL doesn't expose (`scroll`, `wheel`, `pointerdown`, `dragover`, `touchstart`, `copy`, …)? Drop down to the array-style API:

```purescript
import PsSpa.Html as H
import PsSpa.Html (onEvent)
import PsSpa.Event (preventDefault, targetValue)

H.div
  [ H.className "drop"
  , onEvent "dragover" (\e -> DragOver e)
  , onEvent "drop" (\e -> Dropped (targetValue e))
  ]
  [ ... ]
```

Both styles produce the same `Html` ADT, so they can sit inside each other.

### Cookbook

**Conditional rendering** — use a helper that returns `Maybe (Html msg)` and flatten with `Data.Array.catMaybes`, or just a plain `if`:

```purescript
import Data.Array (catMaybes)
import Data.Maybe (Maybe(..))

view model =
  D.div { className: "page" }
    (catMaybes
      [ Just (D.h1 {} [ D.text "Dashboard" ])
      , if model.loggedIn
          then Just (D.button { onClick: Logout } [ D.text "Sign out" ])
          else Nothing
      , Just (D.section {} [ D.text "Content" ])
      ])
```

**Lists of items** — plain `map`:

```purescript
D.ul { className: "stack" }
  (map (\todo -> D.li { className: "row" } [ D.text todo.label ]) model.todos)
```

**Conditional className with multiple flags** — `Data.String.Common.joinWith`:

```purescript
import Data.Array (catMaybes)
import Data.String.Common (joinWith)
import Data.Maybe (Maybe(..))

classes :: Array (Maybe String) -> String
classes parts = joinWith " " (catMaybes parts)

D.button
  { className:
      classes
        [ Just "btn"
        , if model.primary then Just "btn-primary" else Nothing
        , if model.disabled then Just "opacity-50" else Nothing
        ]
  , disabled: model.disabled
  }
  [ D.text "Submit" ]
```

**Submit a form without page reload** — let the runtime stop the default action via `preventDefault` inside the handler. With `onSubmit` from the DSL this is automatic — the synthetic event is dispatched, but `<form>` still submits unless you intercept it via the array API:

```purescript
import PsSpa.Html as H
import PsSpa.Html (onEvent)
import PsSpa.Event (preventDefault)
import Effect (Effect)

submitFx :: forall msg. msg -> Effect Unit
submitFx = const (pure unit)  -- pretend dispatcher; in real code use page's dispatch

H.form
  [ onEvent "submit" \event -> do
      preventDefault event
      pure SaveForm
  ]
  [ … ]
```

For a simpler version: pair `D.form { onSubmit: SaveForm }` with `<button type_="button">` instead of `type_="submit"` so the browser doesn't try to submit.

**Focus an input on mount** — declare a `Command` that runs the actual focus call via FFI:

```purescript
data Command = FocusInput String   -- elementId

init = { model: { … }, effect: [ FocusInput "search" ] }

-- in Main.purs onCommand:
onCommand cmd = case cmd of
  FocusInput id -> focusById id   -- FFI to document.getElementById(id).focus()
```

See [examples/basic/src/Pages/EffectsAndSubscriptions.purs](examples/basic/src/Pages/EffectsAndSubscriptions.purs) for a runnable end-to-end example with commands + subscriptions.

### What the DSL is *not*

So you know what you're trading off:

- **No virtual DOM diffing.** Until v0.5.x the renderer rebuilt the DOM tree on every state change; v0.5.2+ does positional diffing in place (preserves focus, faster on equal-shape rerenders) but still doesn't do keyed reordering. For lists where rows move around (drag-and-drop sort, virtualisation), you'll see flicker / lost focus.
- **No keyed lists.** Children are matched by index. Reordering = full reset of element identity. If you need stable identity, use record fields like `id` to detect the change yourself.
- **No SSR.** The renderer only knows how to call `document.createElement`. Server-side rendering to a string is not supported.
- **No ref callbacks.** You cannot get a handle to the underlying DOM element from inside the DSL. Reach for `Command`s and FFI for things like "focus this input after mount".
- **No `dangerouslySetInnerHTML`.** All text goes through `createTextNode`, so it's always escaped. Rendering markdown output requires using FFI to set `innerHTML` on a wrapper element via a custom Command.
- **No type-level "this attr belongs on this element".** `D.div { onSubmit: Foo }` compiles. TypeScript/JSX catches this; we don't.
- **No CSS-in-JS / style objects.** `style :: String` only — you write the literal CSS string.
- **SVG and MathML elements exist (`D.svg`, `D.math`), but the renderer uses `createElement`, not `createElementNS`.** They land in the tree, but won't render as graphics in the browser. Workaround: render SVG via `dangerouslySetInnerHTML`-style FFI for now.

### Deep coverage tests

The DSL is covered by deep PureScript tests in [test/Test/Main.purs](test/Test/Main.purs): every element function, every attribute name mapping (`className → class`, `htmlFor → for`, `encType → enctype`, `httpEquiv → http-equiv`, `srcSet → srcset`, ...), boolean true/false behaviour, ARIA-bool always-emit semantics, integer/string overloads, event handler routing, generic data/aria expansion, and deep nesting with custom Msg types. Run them with `npm run test:ps`.
