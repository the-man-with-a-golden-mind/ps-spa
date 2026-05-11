module PsSpa.Request
  ( QueryParam
  , Request
  , fragmentValue
  , hasQueryParam
  , queryBoolean
  , queryInt
  , queryParam
  , queryParams
  ) where

import Prelude

import Data.Array (filter, find)
import Data.Int as Int
import Data.Maybe (Maybe(..))
import PsSpa.Option (Option(..))

type QueryParam =
  { key :: String
  , value :: String
  }

type Request route params =
  { route :: route
  , params :: params
  , path :: Array String
  , query :: Array QueryParam
  , fragment :: Option String
  , href :: String
  }

queryParam :: forall route params. String -> Request route params -> Maybe String
queryParam key request =
  _.value <$> find (\item -> item.key == key) request.query

queryParams :: forall route params. String -> Request route params -> Array String
queryParams key request =
  _.value <$> filter (\item -> item.key == key) request.query

hasQueryParam :: forall route params. String -> Request route params -> Boolean
hasQueryParam key request =
  case queryParam key request of
    Just _ ->
      true

    Nothing ->
      false

queryInt :: forall route params. String -> Request route params -> Maybe Int
queryInt key request =
  queryParam key request >>= Int.fromString

queryBoolean :: forall route params. String -> Request route params -> Maybe Boolean
queryBoolean key request =
  case queryParam key request of
    Just "true" ->
      Just true

    Just "false" ->
      Just false

    Just "1" ->
      Just true

    Just "0" ->
      Just false

    Just "yes" ->
      Just true

    Just "no" ->
      Just false

    Just "on" ->
      Just true

    Just "off" ->
      Just false

    _ ->
      Nothing

fragmentValue :: forall route params. Request route params -> Maybe String
fragmentValue request =
  case request.fragment of
    Some value ->
      Just value

    None ->
      Nothing
