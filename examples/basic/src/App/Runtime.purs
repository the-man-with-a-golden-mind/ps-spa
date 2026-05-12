module App.Runtime
  ( Command(..)
  , Subscription(..)
  , onCommand
  , onSubscription
  ) where

import Prelude

import Effect (Effect)
import PsSpa.Browser (Cleanup)

data Command
  = PublishNotice String

data Subscription msg
  = Every Int msg
  | OnNotice (String -> msg)

onCommand :: Command -> Effect Unit
onCommand command =
  case command of
    PublishNotice notice ->
      emitNotice notice

onSubscription :: forall msg. (msg -> Effect Unit) -> Subscription msg -> Effect Cleanup
onSubscription dispatch subscription =
  case subscription of
    Every milliseconds msg ->
      every milliseconds (dispatch msg)

    OnNotice toMsg ->
      subscribeNotice (\notice -> dispatch (toMsg notice))

foreign import emitNotice :: String -> Effect Unit

foreign import every :: Int -> Effect Unit -> Effect Cleanup

foreign import subscribeNotice :: (String -> Effect Unit) -> Effect Cleanup
