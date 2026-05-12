module Pages.EffectsAndSubscriptions
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

import App.Runtime as AppRuntime
import Data.Array (length, null, take)
import Data.Maybe (Maybe(..))
import Generated.Link as Link
import Generated.Route (Request, Route(..))
import PsSpa.Effect as Effect
import PsSpa.Html as H
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind(..))
import PsSpa.View (Document)

type Model =
  { ticks :: Int
  , running :: Boolean
  , nextNotice :: Int
  , notices :: Array String
  }

data Msg
  = ToggleTicker
  | EmitNotice
  | Tick
  | NoticeReceived String
  | ClearNotices

page :: forall shared. Request -> Page.Page Model Msg shared Route AppRuntime.Command AppRuntime.Subscription
page _ =
  Page.advanced
    { init
    , update
    , view
    , subscriptions
    }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

init :: forall shared route. Page.Step Model (Effect.Effect AppRuntime.Command shared route)
init =
  { model:
      { ticks: 0
      , running: true
      , nextNotice: 1
      , notices: []
      }
  , effect:
      Effect.fromCommand
        (AppRuntime.PublishNotice "Effects page mounted")
  }

update :: forall shared route. Msg -> Model -> Page.Step Model (Effect.Effect AppRuntime.Command shared route)
update msg model =
  case msg of
    ToggleTicker ->
      { model:
          model
            { running = not model.running
            }
      , effect: Effect.none
      }

    EmitNotice ->
      let
        notice =
          "Custom command emitted notice #" <> show model.nextNotice
      in
        { model:
            model
              { nextNotice = model.nextNotice + 1
              }
        , effect:
            Effect.fromCommand
              (AppRuntime.PublishNotice notice)
        }

    Tick ->
      { model:
          model
            { ticks = model.ticks + 1
            }
      , effect: Effect.none
      }

    NoticeReceived notice ->
      { model:
          model
            { notices = take 6 ([ notice ] <> model.notices)
            }
      , effect: Effect.none
      }

    ClearNotices ->
      { model:
          model
            { notices = []
            }
      , effect: Effect.none
      }

subscriptions :: Model -> Array (AppRuntime.Subscription Msg)
subscriptions model =
  [ AppRuntime.OnNotice NoticeReceived ]
    <> if model.running then
        [ AppRuntime.Every 1000 Tick ]
      else
        []

view :: Model -> Document Msg
view model =
  { title: "Effects And Subscriptions"
  , body:
      [ H.main
          [ H.className "mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16" ]
          [ H.h1
              [ H.className "text-4xl font-bold tracking-tight text-slate-950" ]
              [ H.text "Custom effects and subscriptions" ]
          , H.p
              [ H.className "max-w-3xl text-lg text-slate-600" ]
              [ H.text "This page uses an app-defined Command and an app-defined Subscription msg. The timer comes from a custom interval subscription, and the notice feed comes back through a custom event bus." ]
          , H.section
              [ H.className "grid gap-4 md:grid-cols-3" ]
              [ statCard "Ticks" (show model.ticks) (if model.running then "interval active" else "interval paused")
              , statCard "Notices" (show (length model.notices)) "delivered through OnNotice"
              , statCard "Next notice" ("#" <> show model.nextNotice) "created by a custom command"
              ]
          , H.div
              [ H.className "flex flex-wrap gap-3" ]
              [ H.button
                  [ H.buttonType H.ButtonButton
                  , H.className "rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                  , H.onClick EmitNotice
                  ]
                  [ H.text "Emit custom command" ]
              , H.button
                  [ H.buttonType H.ButtonButton
                  , H.className "rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900"
                  , H.onClick ToggleTicker
                  ]
                  [ H.text (if model.running then "Pause interval subscription" else "Resume interval subscription") ]
              , H.button
                  [ H.buttonType H.ButtonButton
                  , H.className "rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900"
                  , H.onClick ClearNotices
                  ]
                  [ H.text "Clear notices" ]
              ]
          , H.section
              [ H.className "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" ]
              [ H.h2
                  [ H.className "text-lg font-semibold text-slate-950" ]
                  [ H.text "Recent notices" ]
              , H.p
                  [ H.className "mt-2 text-sm text-slate-600" ]
                  [ H.text "Each click emits AppRuntime.PublishNotice. The active OnNotice subscription converts the payload back into NoticeReceived." ]
              , H.ul
                  [ H.className "mt-4 grid gap-3" ]
                  (if null model.notices then
                    [ H.li
                        [ H.className "rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500" ]
                        [ H.text "No notices yet." ]
                    ]
                  else
                    map
                      (\notice ->
                        H.li
                          [ H.className "rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900" ]
                          [ H.text notice ]
                      )
                      model.notices)
              ]
          , H.div
              [ H.className "flex flex-wrap gap-4 text-sm font-medium" ]
              [ Link.link
                  Index
                  [ H.className "text-slate-600 underline decoration-slate-300 underline-offset-4" ]
                  [ H.text "Back home" ]
              , Link.link
                  Playground
                  [ H.className "text-slate-600 underline decoration-slate-300 underline-offset-4" ]
                  [ H.text "Open playground" ]
              ]
          ]
      ]
  }

statCard :: String -> String -> String -> H.Html Msg
statCard label value detail =
  H.article
    [ H.className "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" ]
    [ H.p
        [ H.className "text-sm font-medium uppercase tracking-[0.18em] text-slate-500" ]
        [ H.text label ]
    , H.p
        [ H.className "mt-3 text-3xl font-semibold text-slate-950" ]
        [ H.text value ]
    , H.p
        [ H.className "mt-2 text-sm text-slate-600" ]
        [ H.text detail ]
    ]

kind :: PageKind
kind = Advanced

hasSubscriptions :: Boolean
hasSubscriptions = true
