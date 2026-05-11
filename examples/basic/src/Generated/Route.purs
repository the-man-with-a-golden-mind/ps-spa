module Generated.Route
  ( Route(..)
  , Request
  , parsePath
  , parseRequest
  , toPath
  ) where

import Prelude

import Data.Array (filter, uncons)
import Data.Foldable (foldl)
import Data.Maybe (Maybe(..))
import Data.String.CodeUnits as CodeUnits
import Data.String.Common (split)
import Data.String.Pattern (Pattern(..))
import PsSpa.Option as Option
import PsSpa.Request as SpaRequest

data Route
  = PeopleNameParam { name :: String }
  | Index
  | Playground
  | NotFound

type Request =
  SpaRequest.Request Route Route

toPath :: Route -> String
toPath route =
  case route of
    PeopleNameParam params -> "" <> "/people" <> "/" <> params.name
    Index -> "/"
    Playground -> "/playground"
    NotFound -> "/not-found"

parsePath :: String -> Route
parsePath href =
  case splitSegments href of
    [ "people", name ] -> PeopleNameParam { name: name }
    [] -> Index
    [ "playground" ] -> Playground
    _ -> NotFound

parseRequest :: String -> Request
parseRequest href =
  let
    route = parsePath href
    path = splitSegments href
  in
    { route
    , params: route
    , path
    , query: parseQuery href
    , fragment: parseFragment href
    , href
    }

splitSegments :: String -> Array String
splitSegments href =
  filter (_ /= "") (split (Pattern "/") (stripFragment (stripQuery href)))

stripQuery :: String -> String
stripQuery =
  takeBefore (Pattern "?")

stripFragment :: String -> String
stripFragment =
  takeBefore (Pattern "#")

takeBefore :: Pattern -> String -> String
takeBefore pattern value =
  case CodeUnits.indexOf pattern value of
    Just index ->
      CodeUnits.take index value

    Nothing ->
      value

takeAfter :: Pattern -> String -> Maybe String
takeAfter pattern value =
  case CodeUnits.indexOf pattern value of
    Just index ->
      Just (CodeUnits.drop (index + 1) value)

    Nothing ->
      Nothing

parseFragment :: String -> Option.Option String
parseFragment href =
  case takeAfter (Pattern "#") href of
    Just fragment ->
      Option.Some fragment

    Nothing ->
      Option.None

parseQuery :: String -> Array SpaRequest.QueryParam
parseQuery href =
  case takeAfter (Pattern "?") (stripFragment href) of
    Just queryString ->
      parseQueryPairs queryString

    Nothing ->
      []

parseQueryPairs :: String -> Array SpaRequest.QueryParam
parseQueryPairs raw =
  split (Pattern "&") raw
    # filter (_ /= "")
    # map parseQueryParam

parseQueryParam :: String -> SpaRequest.QueryParam
parseQueryParam chunk =
  case uncons (split (Pattern "=") chunk) of
    Just { head: key, tail: valueParts } ->
      { key
      , value: joinWithEquals valueParts
      }

    Nothing ->
      { key: ""
      , value: ""
      }

joinWithEquals :: Array String -> String
joinWithEquals parts =
  case uncons parts of
    Nothing ->
      ""

    Just { head: first, tail: rest } ->
      foldl (\acc next -> acc <> "=" <> next) first rest
