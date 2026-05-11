module PsSpa.LoadResult
  ( LoadResult(..)
  ) where

import PsSpa.LoadedPage (LoadedPage)

data LoadResult shared route command subscription
  = Redirect route
  | Loaded (LoadedPage shared route command subscription)
