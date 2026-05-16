module Pages.People.NameParam
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
import PsSpa.Effect as Effect
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
  Page.advanced
    { init
    , update
    , view: view request
    , subscriptions
    }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

init :: forall shared route command. Page.Step Model (Effect.Effect command shared route)
init =
  { model:
      { status: "ready"
      }
  , effect: Effect.none
  }

update :: forall shared route command. Msg -> Model -> Page.Step Model (Effect.Effect command shared route)
update msg model =
  case msg of
    Triggered ->
      { model:
          { status: "handled"
          }
      , effect: Effect.none
      }

subscriptions :: forall subscription. Model -> Array (subscription Msg)
subscriptions _ =
  []

view :: Request -> Model -> Document Msg
view request model =
  let
    personName =
      case request.route of
        PeopleNameParam { name } ->
          name

        _ ->
          "unknown"
  in
  { title: "People Name"
  , body:
      [ H.main
          [ H.className "mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6 py-16" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text ("Person: " <> personName) ]
          , H.p
              [ H.className "text-lg text-slate-600" ]
              [ H.text ("This page was matched from the dynamic route /people/" <> personName <> ".") ]
          , H.p
              [ H.className "rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" ]
              [ H.text ("Current status: " <> model.status) ]
          , H.button
              [ H.className "w-fit rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
              , H.onClick Triggered
              ]
              [ H.text "Run advanced update" ]
          , Link.linkAttrs
              Index
              [ H.className "w-fit text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4" ]
              [ H.text "Back home" ]
          , Link.linkAttrs
              (PeopleNameParam { name: "alex" })
              [ H.className "w-fit text-sm font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-4" ]
              [ H.text "Jump to /people/alex" ]
          ]
      ]
  }

kind :: PageKind
kind = Advanced

hasSubscriptions :: Boolean
hasSubscriptions = true
