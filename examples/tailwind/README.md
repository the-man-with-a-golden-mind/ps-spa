# tailwind

This is a standalone example app for `ps-spa` with the `tailwind` page template enabled. It uses Tailwind v4 via `@tailwindcss/vite` — no `tailwind.config.cjs` or `postcss.config.cjs` needed.

Run it from this directory:

```bash
bun install
bun run dev
```

or:

```bash
npm install
npm run dev
```

Build a production bundle from this directory:

```bash
bun run build
```

Routes in this example:

- `/`
- `/not-found`
- `/marketing/hero`
- `/guides/:slug`

## Writing a page

Pages use the record-based DSL from [`PsSpa.Html.DSL`](../../src/PsSpa/Html/DSL.purs), which makes Tailwind class lists ergonomic:

```purescript
import PsSpa.Html.DSL as D

view =
  { title: "Marketing"
  , body:
      [ D.section { className: "grid gap-4 md:grid-cols-2" }
          [ D.div { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" }
              [ D.h1 { className: "mt-3 text-3xl font-bold tracking-tight text-slate-950" }
                  [ D.text "A stronger starter." ]
              , D.p { className: "mt-3 text-base text-slate-600" }
                  [ D.text "Tailwind v4 + ps-spa scaffold." ]
              ]
          , D.div { className: "rounded-3xl bg-slate-950 p-6 text-white" }
              [ D.p { className: "text-sm uppercase tracking-[0.2em] text-sky-300" }
                  [ D.text "Next steps" ]
              ]
          ]
      ]
  }
```

See the [main README](../../README.md#html-dsl) for the full DSL reference (events, ARIA, data-* helpers, etc.).
