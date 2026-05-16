module Pages.Playground
  ( Model
  , Msg(..)
  , hasSubscriptions
  , init
  , kind
  , page
  , protect
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
  { counter :: Int
  }

data Msg
  = Increment
  | Decrement

page :: forall shared command subscription. Request -> Page.Page Model Msg shared Route command subscription
page _ =
  Page.sandbox
    { init
    , update
    , view
    }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

init :: Model
init =
  { counter: 0
  }

update :: Msg -> Model -> Model
update msg model =
  case msg of
    Increment ->
      { counter: model.counter + 1 }

    Decrement ->
      { counter: model.counter - 1 }

view :: Model -> Document Msg
view model =
  { title: "Playground"
  , body:
      [ H.main
          [ H.className "mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6 py-16" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text "Playground" ]
          , H.p
              [ H.className "text-lg text-slate-600" ]
              [ H.text "Sandbox page with local state." ]
          , H.div
              [ H.className "flex items-center gap-3" ]
              [ H.button
                  [ H.className "rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
                  , H.onClick Decrement
                  ]
                  [ H.text "-" ]
              , H.p
                  [ H.className "min-w-12 text-center text-2xl font-semibold text-slate-950" ]
                  [ H.text (show model.counter) ]
              , H.button
                  [ H.className "rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
                  , H.onClick Increment
                  ]
                  [ H.text "+" ]
              ]
          , Link.linkAttrs
              Index
              [ H.className "w-fit text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4" ]
              [ H.text "Back home" ]
          ]
      ]
  }

kind :: PageKind
kind = Sandbox

hasSubscriptions :: Boolean
hasSubscriptions = false
