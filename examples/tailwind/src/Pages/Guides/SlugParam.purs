module Pages.Guides.SlugParam
  ( Model
  , Msg(..)
  , hasSubscriptions
  , init
  , kind
  , page
  , protect
  , subscriptions
  , update
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

type Model =
  { status :: String
  }

data Msg
  = Triggered

page :: forall shared command subscription. Request -> Page.Page Model Msg shared Route command subscription
page request =
  Page.element
    { init
    , update
    , view: view request
    , subscriptions
    }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

init :: forall command. Page.Step Model (Array command)
init =
  { model:
      { status: "idle"
      }
  , effect: []
  }

update :: forall command. Msg -> Model -> Page.Step Model (Array command)
update msg model =
  case msg of
    Triggered ->
      { model:
          { status: "updated"
          }
      , effect: []
      }

subscriptions :: forall subscription. Model -> Array subscription
subscriptions _ =
  []

view :: Request -> Model -> Document Msg
view request model =
  let
    currentSlug =
      case request.route of
        GuidesSlugParam { slug } ->
          slug

        _ ->
          "unknown"
  in
  { title: "Guides Slug"
  , body:
      [ H.main
          [ H.className "mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6 py-16" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text ("Guide: " <> currentSlug) ]
          , H.p
              [ H.className "text-lg text-slate-600" ]
              [ H.text ("This route is resolved from /guides/" <> currentSlug <> " and re-renders locally when the button changes state.") ]
          , H.p
              [ H.className "rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700" ]
              [ H.text ("Current status: " <> model.status) ]
          , H.button
              [ H.className "w-fit rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              , H.onClick Triggered
              ]
              [ H.text "Trigger update" ]
          , Link.link
              Index
              [ H.className "w-fit text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4" ]
              [ H.text "Back home" ]
          , Link.link
              (GuidesSlugParam { slug: "tea" })
              [ H.className "w-fit text-sm font-medium text-sky-700 underline decoration-sky-300 underline-offset-4" ]
              [ H.text "Jump to /guides/tea" ]
          ]
      ]
  }

kind :: PageKind
kind = Element

hasSubscriptions :: Boolean
hasSubscriptions = true
