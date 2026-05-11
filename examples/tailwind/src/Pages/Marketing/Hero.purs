module Pages.Marketing.Hero
  ( hasSubscriptions
  , kind
  , page
  , protect
  , view
  ) where

import Prelude
import Data.Maybe (Maybe(..))
import Generated.Link as Link
import Generated.Route (Request, Route(..))
import PsSpa.Html as H
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind(..))
import PsSpa.View (Document)

page :: forall shared command subscription. Request -> Page.Page Unit Void shared Route command subscription
page _ =
  Page.static
    { view }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

view :: Document Void
view =
  { title: "Marketing Hero"
  , body:
      [ H.main
          [ H.className "mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6 py-16" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text "Marketing Hero" ]
          , H.p
              [ H.className "text-lg text-slate-600" ]
              [ H.text "Generated tailwind page for route /marketing/hero." ]
          , Link.link
              Index
              [ H.className "w-fit rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800" ]
              [ H.text "Back home" ]
          , H.section
              [ H.className "grid gap-4 md:grid-cols-2" ]
              [ H.div
                  [ H.className "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" ]
                  [ H.p
                      [ H.className "text-sm font-semibold uppercase tracking-[0.2em] text-sky-600" ]
                      [ H.text "Tailwind ready" ]
                  , H.h1
                      [ H.className "mt-3 text-3xl font-bold tracking-tight text-slate-950" ]
                      [ H.text "A stronger starter than a placeholder." ]
                  , H.p
                      [ H.className "mt-3 text-base text-slate-600" ]
                      [ H.text "This template scaffolds Tailwind config files and gives the page a real visual starting point." ]
                  ]
              , H.div
                  [ H.className "rounded-3xl bg-slate-950 p-6 text-white" ]
                  [ H.p
                      [ H.className "text-sm font-semibold uppercase tracking-[0.2em] text-sky-300" ]
                      [ H.text "Next steps" ]
                  , H.p
                      [ H.className "mt-3 text-base text-slate-200" ]
                      [ H.text "Run npm install or bun install, then start the app with npm run dev or bun run dev." ]
                  ]
              ]
          ]
      ]
  }

kind :: PageKind
kind = Tailwind

hasSubscriptions :: Boolean
hasSubscriptions = false
