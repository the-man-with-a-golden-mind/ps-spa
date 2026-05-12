![ps-spa logo](logo.png)

`ps-spa` is a PureScript-first attempt to recreate the `elm-spa` workflow with:

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

This repository currently contains the framework foundation:

- PureScript core types in [`src/PsSpa`](src/PsSpa)
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

- generates a Tailwind-styled page module
- scaffolds `tailwind.config.cjs`, `postcss.config.cjs`, `styles/tailwind.css`, `public/.gitkeep`, and package dependencies on demand

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

## Publish Status

`ps-spa` is now prepared as two artifacts from one repo:

- an npm package that exposes the `ps-spa` CLI
- a proper PureScript library package with [`spago.yaml`](spago.yaml) publish metadata for the PureScript Registry

The npm package still ships the library sources for scaffolded apps today, but the repo now carries the package metadata needed for a real Registry release as well.
See [docs/publishing.md](docs/publishing.md).

## HTML DSL

The HTML layer is now meant to feel closer to JSX than to low-level constructors. Instead of `Html.main_` and `Html.class_`, pages can use the shorter style from [src/PsSpa/Html.purs](src/PsSpa/Html.purs):

```purescript
import PsSpa.Html as H

H.main
  [ H.className "mx-auto max-w-3xl px-6 py-16" ]
  [ H.h1 [ H.className "text-4xl font-bold" ] [ H.text "Hello" ]
  , H.p [] [ H.text "This reads much closer to JSX." ]
  , H.a [ H.href "/about", H.className "underline" ] [ H.text "About" ]
  ]
```
