# AGENTS

This repository contains both the `ps-spa` framework core and standalone example apps.

## Default Repo Map

- `src/PsSpa`: framework runtime, page model, HTML DSL, request helpers
- `scripts/cli`: route parsing, code generation, scaffolding, verification
- `examples/*`: standalone consumer apps generated or maintained with the CLI
- `docs`: human-facing documentation
- `llms.txt`: short machine-readable summary

## How To Work In This Repo

1. Treat `src/PsSpa` as framework-owned code.
2. Treat `examples/*/src/Pages` as app-owned code.
3. Treat `examples/*/src/Generated` as generated output.
4. After changing routing, templates, or codegen, run `ps-spa gen` for the affected app.
5. Prefer `ps-spa verify` before considering a change done.

## Default Consumer Workflow

1. `ps-spa new my-app`
2. `cd my-app`
3. `ps-spa add /some/route advanced`
4. Edit `src/Pages/*`
5. `ps-spa gen`
6. `npm run dev` or `bun run dev`

## Constraints

- Do not hand-edit generated files as the default path.
- Do not treat example app code as framework core.
- Do not assume multiple apps can share one PureScript output directory.

## When You Change Core Behavior

- Update or review `tests-js/routes.test.mjs`.
- Re-run `node --test "tests-js/**/*.test.mjs"`.
- Re-run `ps-spa verify` for affected examples.
- If docs or workflow changed, update `README.md` and `docs/*`.
