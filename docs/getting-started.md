# Getting Started

## Create a New App

```bash
node scripts/ps-spa.mjs new examples/my-app
```

That creates:

- `src/Main.purs`
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
