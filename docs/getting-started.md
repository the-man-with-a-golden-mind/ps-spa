# Getting Started

## Create a New App

```bash
node scripts/ps-spa.mjs new examples/my-app
```

That creates:

- `src/Main.purs`
- `src/Pages`
- `src/Generated`
- `spago.dhall`
- `index.html`
- `package.json`
- browser benchmark pages under `public/bench`

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
