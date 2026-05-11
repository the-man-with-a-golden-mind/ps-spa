# AI Usage Guide

This document is for coding assistants and agents that need to use `ps-spa` correctly.

## Mental Model

- `src/PsSpa` is the framework core.
- `src/Pages` belongs to an app, not to the framework.
- `src/Generated` is generated output and should not be hand-edited unless you are explicitly debugging the generator itself.

## Default Workflow

1. Create or open an app root.
2. Add pages under `src/Pages` or generate them with `ps-spa add`.
3. Run `ps-spa gen`.
4. Edit user-owned page modules under `src/Pages`.
5. Use `ps-spa verify` to check drift before finishing.

## Commands

- `ps-spa new <dir>`
- `ps-spa add <route> [static|sandbox|element|advanced|tailwind]`
- `ps-spa gen`
- `ps-spa verify`
- `ps-spa doctor`

## What Not To Do

- Do not hand-edit generated files as the default workflow.
- Do not assume the example apps are the framework core.
- Do not rely on a shared PureScript output directory across multiple apps.

## When Editing This Repo

- Framework changes usually live in `src/PsSpa` or `scripts/cli`.
- Example-specific UX changes belong in `examples/*`.
- If you change route generation, update `tests-js/routes.test.mjs` and regenerate examples if needed.
