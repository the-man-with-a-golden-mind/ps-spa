module Main where

import Prelude

import App.Runtime as AppRuntime
import Effect (Effect)
import Generated.App as App
import Shared as Shared

main :: Effect Unit
main =
  App.startWith
    { initialShared: Shared.init
    , onCommand: AppRuntime.onCommand
    , onSubscription: AppRuntime.onSubscription
    , rootId: "app"
    , sharedSubscriptions: \_ _ -> []
    }
