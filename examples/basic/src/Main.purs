module Main where

import Prelude

import App.Runtime as AppRuntime
import Effect (Effect)
import Generated.App as App

main :: Effect Unit
main =
  App.startWith
    { initialShared: unit
    , onCommand: AppRuntime.onCommand
    , onSubscription: AppRuntime.onSubscription
    , rootId: "app"
    , sharedSubscriptions: \_ _ -> []
    }
