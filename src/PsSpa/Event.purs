-- | Opaque DOM event handed to handlers registered with `PsSpa.Html.onEvent`
-- | (and its specialisations like `onInput`, `onKeyDown`, …).
-- |
-- | The helpers in this module extract the most common pieces — value, key,
-- | modifiers, geometry — and return zeroed defaults when the field doesn't
-- | apply to the event type (so the FFI surface stays total).
-- |
-- | Example:
-- |
-- |   onEvent "wheel" \event ->
-- |     Scrolled { dy: deltaY event, ctrl: ctrlKey event }
module PsSpa.Event
  ( EventValue
  -- target / value
  , targetValue
  , targetChecked
  , targetId
  -- keyboard
  , keyName
  , keyCode
  -- mouse / pointer / touch geometry
  , clientX
  , clientY
  , pageX
  , pageY
  , screenX
  , screenY
  , deltaX
  , deltaY
  , button
  -- modifiers
  , altKey
  , ctrlKey
  , shiftKey
  , metaKey
  -- event control
  , preventDefault
  , stopPropagation
  ) where

import Prelude

import Effect (Effect)

foreign import data EventValue :: Type

foreign import targetValue :: EventValue -> String
foreign import targetChecked :: EventValue -> Boolean
foreign import targetIdImpl :: EventValue -> String
foreign import keyName :: EventValue -> String
foreign import keyCodeImpl :: EventValue -> Int
foreign import clientXImpl :: EventValue -> Int
foreign import clientYImpl :: EventValue -> Int
foreign import pageXImpl :: EventValue -> Int
foreign import pageYImpl :: EventValue -> Int
foreign import screenXImpl :: EventValue -> Int
foreign import screenYImpl :: EventValue -> Int
foreign import deltaXImpl :: EventValue -> Int
foreign import deltaYImpl :: EventValue -> Int
foreign import buttonImpl :: EventValue -> Int
foreign import altKey :: EventValue -> Boolean
foreign import ctrlKey :: EventValue -> Boolean
foreign import shiftKey :: EventValue -> Boolean
foreign import metaKey :: EventValue -> Boolean
foreign import preventDefaultImpl :: EventValue -> Effect Unit
foreign import stopPropagationImpl :: EventValue -> Effect Unit

targetId :: EventValue -> String
targetId = targetIdImpl

keyCode :: EventValue -> Int
keyCode = keyCodeImpl

clientX :: EventValue -> Int
clientX = clientXImpl

clientY :: EventValue -> Int
clientY = clientYImpl

pageX :: EventValue -> Int
pageX = pageXImpl

pageY :: EventValue -> Int
pageY = pageYImpl

screenX :: EventValue -> Int
screenX = screenXImpl

screenY :: EventValue -> Int
screenY = screenYImpl

deltaX :: EventValue -> Int
deltaX = deltaXImpl

deltaY :: EventValue -> Int
deltaY = deltaYImpl

button :: EventValue -> Int
button = buttonImpl

preventDefault :: EventValue -> Effect Unit
preventDefault = preventDefaultImpl

stopPropagation :: EventValue -> Effect Unit
stopPropagation = stopPropagationImpl
