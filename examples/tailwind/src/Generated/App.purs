module Generated.App
  ( AppConfig
  , start
  , startWith
  ) where

import Prelude

import Effect (Effect)
import Generated.Pages as Pages
import Generated.Route as Route
import PsSpa.Browser as Browser
import PsSpa.Runtime as Runtime

type AppConfig shared command subscription =
  { initialShared :: shared
  , onCommand :: command -> Effect Unit
  , onSubscription :: subscription -> Effect Browser.Cleanup
  , rootId :: String
  , sharedSubscriptions :: Route.Request -> shared -> Array subscription
  }

start :: Effect Unit
start =
  startWith
    { initialShared: unit
    , onCommand: absurd
    , onSubscription: absurd
    , rootId: "app"
    , sharedSubscriptions: \_ _ -> []
    }

startWith :: forall shared command subscription. AppConfig shared command subscription -> Effect Unit
startWith config =
  Runtime.start
    { initialShared: config.initialShared
    , loadPage: Pages.loadPage
    , onCommand: config.onCommand
    , onSubscription: config.onSubscription
    , parseRequest: Route.parseRequest
    , rootId: config.rootId
    , sharedSubscriptions: config.sharedSubscriptions
    , toPath: Route.toPath
    }
