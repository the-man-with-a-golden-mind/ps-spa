# Getting Started

## Create a New App

```bash
node scripts/ps-spa.mjs new examples/my-app
```

That creates:

- `src/Main.purs`
- `src/Shared.purs` — app-wide state record (see [Shared State and Auth](#shared-state-and-auth))
- `src/Auth.purs` — `User` type and reusable protect guards (see [Shared State and Auth](#shared-state-and-auth))
- `src/Pages`
- `src/Generated`
- `spago.yaml` — workspace-style manifest for spago 1.0+, with `ps-spa` wired via `workspace.extraPackages.ps-spa.path: node_modules/ps-spa`
- `index.html`
- `package.json` — `vite` / `vite build` / `vite preview` scripts, plus `vite`, `esbuild`, and `spago` as devDependencies (no globally-installed spago required)
- browser benchmark pages under `public/bench`

Page modules emit code that uses the record-based DSL in [`PsSpa.Html.DSL`](../src/PsSpa/Html/DSL.purs) — see the [HTML DSL section in the main README](../README.md#html-dsl).

## Add Pages

```bash
node scripts/ps-spa.mjs --root examples/my-app add /playground sandbox
node scripts/ps-spa.mjs --root examples/my-app add /people/:name advanced
node scripts/ps-spa.mjs --root examples/my-app add /marketing/hero tailwind
```

## Regenerate

```bash
node scripts/ps-spa.mjs --root examples/my-app gen
```

## Verify Generated State

```bash
node scripts/ps-spa.mjs --root examples/my-app verify
node scripts/ps-spa.mjs --root examples/my-app doctor
```

## Shared State and Auth

Two app-level modules are scaffolded next to your pages so you can edit them freely:

- **`src/Shared.purs`** — defines the `Shared` record handed to every page and protect guard. The default ships a single `currentUser :: Maybe User` field; add more (theme, feature flags, session token, …) as your app grows.
- **`src/Auth.purs`** — defines the `User` type plus `requireUser` / `optionalUser` helpers. `requireUser` is a reusable protect guard you drop into any page that needs authentication.

`Main.purs` wires `Shared.init` through `App.startWith`, so the shared record is live from the first render:

```purescript
main =
  App.startWith
    { initialShared: Shared.init
    , onCommand: absurd
    , onSubscription: \_ (Const impossible) -> absurd impossible
    , rootId: "app"
    , sharedSubscriptions: \_ _ -> []
    }
```

To gate a page behind authentication, replace its default `protect`:

```purescript
import Auth as Auth
import Generated.Route (Route(..))

-- redirect unauthenticated visitors to /login
protect = Auth.requireUser Login
```

`Auth.requireUser` is row-polymorphic in `shared`, so adding fields to `Shared` doesn't break the helper. To update `shared.currentUser` on login, an advanced page emits a fresh value via `Effect.fromShared`:

```purescript
update LoginSucceeded model =
  { model
  , effect: Effect.fromShared (model.shared { currentUser = Just user })
  }
```

The runtime swaps `shared`, re-renders the current page, and the next protect guard sees the new state.

## Run an Example Project

From the app directory:

```bash
bun install
bun run dev
```

or:

```bash
npm install
npm run dev
```
