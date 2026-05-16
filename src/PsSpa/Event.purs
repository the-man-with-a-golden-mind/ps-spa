-- | Opaque DOM event used by generic event handlers in `PsSpa.Html`.
-- |
-- | The handler signature is `EventValue -> msg`, where you extract whatever
-- | piece of the event you actually care about with the helpers in this module:
-- |
-- |   onInput (\\e -> Input (targetValue e))
-- |   onKeyDown (\\e -> KeyPressed (keyName e))
module PsSpa.Event
  ( EventValue
  , targetValue
  , targetChecked
  , keyName
  , preventDefault
  , stopPropagation
  ) where

import Prelude

import Effect (Effect)

foreign import data EventValue :: Type

foreign import targetValue :: EventValue -> String
foreign import targetChecked :: EventValue -> Boolean
foreign import keyName :: EventValue -> String
foreign import preventDefaultImpl :: EventValue -> Effect Unit
foreign import stopPropagationImpl :: EventValue -> Effect Unit

preventDefault :: EventValue -> Effect Unit
preventDefault = preventDefaultImpl

stopPropagation :: EventValue -> Effect Unit
stopPropagation = stopPropagationImpl
