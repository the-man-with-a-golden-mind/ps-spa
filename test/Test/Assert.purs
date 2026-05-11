module Test.Assert
  ( Assertion
  , assertEqual
  , assertTrue
  , failTest
  , group
  ) where

import Prelude

import Data.Foldable (traverse_)
import Effect (Effect)
import Effect.Console as Console

type Assertion = Effect Unit

foreign import failTest :: String -> Assertion

assertTrue :: String -> Boolean -> Assertion
assertTrue label condition =
  unless condition do
    failTest ("Assertion failed: " <> label)

assertEqual :: forall a. Eq a => Show a => String -> a -> a -> Assertion
assertEqual label expected actual =
  unless (expected == actual) do
    failTest
      ( "Assertion failed: "
          <> label
          <> "\nexpected: "
          <> show expected
          <> "\nactual: "
          <> show actual
      )

group :: String -> Array Assertion -> Assertion
group label assertions = do
  Console.log ("Running " <> label)
  traverse_ identity assertions
