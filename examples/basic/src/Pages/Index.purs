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
          [ H.className "mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text "ps-spa basic example" ]
          , H.p
              [ H.className "text-lg text-slate-600" ]
              [ H.text "This example proves file-based routing, dynamic params, and local TEA state in one small app." ]
          , H.section
              [ H.className "grid gap-4 md:grid-cols-2 xl:grid-cols-4" ]
              [ H.div
                  [ H.className "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" ]
                  [ H.h2
                      [ H.className "text-lg font-semibold text-slate-950" ]
                      [ H.text "Sandbox state" ]
                  , H.p
                      [ H.className "mt-2 text-sm text-slate-600" ]
                      [ H.text "Local counter updates on the page without navigation." ]
                  , Link.link
                      Playground
                      [ H.className "mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" ]
                      [ H.text "Open playground" ]
                  ]
              , H.div
                  [ H.className "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" ]
                  [ H.h2
                      [ H.className "text-lg font-semibold text-slate-950" ]
                      [ H.text "Dynamic route" ]
                  , H.p
                      [ H.className "mt-2 text-sm text-slate-600" ]
                      [ H.text "This route is generated from Pages.People.NameParam and receives a path param." ]
                  , Link.link
                      (PeopleNameParam { name: "michal" })
                      [ H.className "mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" ]
                      [ H.text "Open /people/michal" ]
                  ]
              , H.div
                  [ H.className "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" ]
                  [ H.h2
                      [ H.className "text-lg font-semibold text-slate-950" ]
                      [ H.text "Effects + subscriptions" ]
                  , H.p
                      [ H.className "mt-2 text-sm text-slate-600" ]
                      [ H.text "Custom command handling and custom subscriptions wired through Generated.App.startWith." ]
                  , Link.link
                      EffectsAndSubscriptions
                      [ H.className "mt-4 inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950" ]
                      [ H.text "Open runtime example" ]
                  ]
              , H.div
                  [ H.className "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" ]
                  [ H.h2
                      [ H.className "text-lg font-semibold text-slate-950" ]
                      [ H.text "404 handling" ]
                  , H.p
                      [ H.className "mt-2 text-sm text-slate-600" ]
                      [ H.text "The generated NotFound page is also routed inside the SPA runtime." ]
                  , Link.link
                      NotFound
                      [ H.className "mt-4 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800" ]
                      [ H.text "Open not-found" ]
                  ]
              ]
          ]
      ]
  }

kind :: PageKind
kind = Static

hasSubscriptions :: Boolean
hasSubscriptions = false
