module PsSpa.Effect
  ( Effect(..)
  , batch
  , fromCommand
  , fromShared
  , mapCommand
  , mapRoute
  , mapShared
  , none
  , push
  , replace
  ) where

import Prelude

data Effect command shared route
  = None
  | Batch (Array (Effect command shared route))
  | FromCommand command
  | FromShared shared
  | Push route
  | Replace route

none :: forall command shared route. Effect command shared route
none = None

batch :: forall command shared route. Array (Effect command shared route) -> Effect command shared route
batch = Batch

fromCommand :: forall command shared route. command -> Effect command shared route
fromCommand = FromCommand

fromShared :: forall command shared route. shared -> Effect command shared route
fromShared = FromShared

push :: forall command shared route. route -> Effect command shared route
push = Push

replace :: forall command shared route. route -> Effect command shared route
replace = Replace

mapCommand
  :: forall commandA commandB shared route
   . (commandA -> commandB)
  -> Effect commandA shared route
  -> Effect commandB shared route
mapCommand lift effect =
  case effect of
    None ->
      None

    Batch items ->
      Batch (mapCommand lift <$> items)

    FromCommand command ->
      FromCommand (lift command)

    FromShared shared ->
      FromShared shared

    Push route ->
      Push route

    Replace route ->
      Replace route

mapShared
  :: forall command sharedA sharedB route
   . (sharedA -> sharedB)
  -> Effect command sharedA route
  -> Effect command sharedB route
mapShared lift effect =
  case effect of
    None ->
      None

    Batch items ->
      Batch (mapShared lift <$> items)

    FromCommand command ->
      FromCommand command

    FromShared shared ->
      FromShared (lift shared)

    Push route ->
      Push route

    Replace route ->
      Replace route

mapRoute
  :: forall command shared routeA routeB
   . (routeA -> routeB)
  -> Effect command shared routeA
  -> Effect command shared routeB
mapRoute lift effect =
  case effect of
    None ->
      None

    Batch items ->
      Batch (mapRoute lift <$> items)

    FromCommand command ->
      FromCommand command

    FromShared shared ->
      FromShared shared

    Push route ->
      Push (lift route)

    Replace route ->
      Replace (lift route)
