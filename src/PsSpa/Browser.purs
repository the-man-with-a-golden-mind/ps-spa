module PsSpa.Browser
  ( Cleanup
  , RuntimeConfig
  , currentPath
  , onInternalUrlRequest
  , onPopState
  , pushUrl
  , renderDocument
  , replaceUrl
  ) where

import Prelude

import Effect (Effect)
import PsSpa.View (Document)

type Cleanup =
  Effect Unit

type RuntimeConfig msg =
  { rootId :: String
  , document :: Document msg
  }

foreign import renderDocument :: RuntimeConfig (Effect Unit) -> Effect Unit

foreign import currentPath :: Effect String

foreign import pushUrl :: String -> Effect Unit

foreign import replaceUrl :: String -> Effect Unit

foreign import onPopState :: Effect Unit -> Effect Cleanup

foreign import onInternalUrlRequest :: (String -> Effect Unit) -> Effect Cleanup
