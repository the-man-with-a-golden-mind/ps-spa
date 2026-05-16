# basic

This is a standalone example app for `ps-spa`.

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
- `/playground`
- `/people/:name`
- `/effects-and-subscriptions`

## Writing a page

Scaffolded pages use the record-based HTML DSL from [`PsSpa.Html.DSL`](../../src/PsSpa/Html/DSL.purs):

```purescript
import PsSpa.Html.DSL as D

view :: Document Void
view =
  { title: "Welcome"
  , body:
      [ D.main { className: "mx-auto max-w-3xl px-6 py-16" }
          [ D.h1 { className: "text-4xl font-bold" } [ D.text "Welcome" ]
          , D.p { className: "text-slate-600" } [ D.text "A starter page." ]
          ]
      ]
  }
```

For internal navigation use `Generated.Link`:

```purescript
import Generated.Link as Link

Link.link Index { className: "underline" } [ D.text "Back home" ]
```

If you have existing pages using the array-based `PsSpa.Html` API (`H.div [H.className "..."] [...]`), they keep working — both styles emit the same ADT. See the [main README](../../README.md#html-dsl) for the full DSL reference.
