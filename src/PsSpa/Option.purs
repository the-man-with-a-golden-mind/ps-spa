module PsSpa.Option
  ( Option(..)
  ) where

import Prelude

data Option a
  = None
  | Some a

derive instance functorOption :: Functor Option
