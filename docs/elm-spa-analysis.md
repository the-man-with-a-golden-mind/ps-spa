# Elm SPA analysis

This project follows the main `elm-spa` ideas, but maps them into PureScript and a smaller custom runtime.

## Core Elm SPA ideas mirrored here

- file-based routing rooted at `src/Pages`
- four page kinds: `static`, `sandbox`, `element`, `advanced`
- generated route and page wiring
- per-page request access
- typed navigation instead of raw string routing as the default workflow

## Current mapping in `ps-spa`

1. `scripts/ps-spa.mjs gen` scans `src/Pages` and generates:
   - `Generated.Route`
   - `Generated.Pages`
   - `Generated.App`
   - `Generated.Link`
2. `src/PsSpa/Page.purs` models the four page kinds.
3. `src/PsSpa/Request.purs` provides route, query, fragment, and href access to pages.
4. `src/PsSpa/Effect.purs` models advanced-page navigation and command effects.
5. `src/PsSpa/Runtime.purs` and `src/PsSpa/Browser.js` mount the generated app in the browser.
6. `src/PsSpa/Html.purs` provides a small JSX-like HTML DSL for generated and hand-written pages.

## Important differences from Elm SPA

- naming is PureScript-native: `Index` and `NameParam` instead of trailing underscore module names
- the runtime is intentionally tiny and custom instead of inherited from Elm
- protected/shared abstractions are not yet as fully developed as mature `elm-spa` app defaults
- the generator already owns more of the default app entrypoint through `Generated.App`

## Primary references

- https://www.elm-spa.dev/guide/02-routing
- https://www.elm-spa.dev/guide/03-pages
- https://www.elm-spa.dev/guide/04-requests
- https://www.elm-spa.dev/guide/05-shared-state
- https://www.elm-spa.dev/examples/04-authentication
