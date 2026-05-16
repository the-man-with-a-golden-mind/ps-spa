module Pages.Index
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
  { title: "Home"
  , body:
      [ H.main
          [ H.className "mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-6 py-16" ]
          [ H.h1
              [ H.className "text-5xl font-bold tracking-tight text-slate-950" ]
              [ H.text "ps-spa tailwind example" ]
          , H.p
              [ H.className "max-w-3xl text-lg text-slate-600" ]
              [ H.text "This example shows a small multi-page app where Tailwind styling, SPA navigation, and generated routes are all visible from the first screen." ]
          , H.section
              [ H.className "grid gap-4 md:grid-cols-2" ]
              [ H.div
                  [ H.className "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" ]
                  [ H.p
                      [ H.className "text-sm font-semibold uppercase tracking-[0.2em] text-sky-600" ]
                      [ H.text "Marketing page" ]
                  , H.h2
                      [ H.className "mt-3 text-2xl font-bold tracking-tight text-slate-950" ]
                      [ H.text "Open the Tailwind hero screen" ]
                  , H.p
                      [ H.className "mt-3 text-sm text-slate-600" ]
                      [ H.text "This route was created from the tailwind page template and should feel like a proper landing page, not a stub." ]
                  , Link.linkAttrs
                      MarketingHero
                      [ H.className "mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" ]
                      [ H.text "Open /marketing/hero" ]
                  ]
              , H.div
                  [ H.className "rounded-3xl bg-slate-950 p-6 text-white shadow-sm" ]
                  [ H.p
                      [ H.className "text-sm font-semibold uppercase tracking-[0.2em] text-sky-300" ]
                      [ H.text "Dynamic route" ]
                  , H.h2
                      [ H.className "mt-3 text-2xl font-bold tracking-tight" ]
                      [ H.text "Open a generated guide slug" ]
                  , H.p
                      [ H.className "mt-3 text-sm text-slate-200" ]
                      [ H.text "This route proves dynamic path matching and element-page updates inside the same app shell." ]
                  , Link.linkAttrs
                      (GuidesSlugParam { slug: "routing" })
                      [ H.className "mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" ]
                      [ H.text "Open /guides/routing" ]
                  ]
              ]
          ]
      ]
  }

kind :: PageKind
kind = Static

hasSubscriptions :: Boolean
hasSubscriptions = false
