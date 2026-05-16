module Pages.NotFound
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
  { title: "Not Found"
  , body:
      [ H.main
          [ H.className "mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6 py-16" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text "Not Found" ]
          , H.p
              [ H.className "text-lg text-slate-600" ]
              [ H.text "Generated static page for route /not-found." ]
          , Link.linkAttrs
              Index
              [ H.className "w-fit rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800" ]
              [ H.text "Back home" ]
          
          ]
      ]
  }

kind :: PageKind
kind = Static

hasSubscriptions :: Boolean
hasSubscriptions = false
