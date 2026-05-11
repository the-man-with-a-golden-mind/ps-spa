module PsSpa.LoadedPage
  ( LoadedPage
  , fromPage
  , withPage
  ) where

import PsSpa.Page as Page

newtype LoadedPage shared route command subscription
  = LoadedPage
      (forall result. (forall model msg. Page.Page model msg shared route command subscription -> result) -> result)

fromPage
  :: forall model msg shared route command subscription
   . Page.Page model msg shared route command subscription
  -> LoadedPage shared route command subscription
fromPage page =
  LoadedPage (\run -> run page)

withPage
  :: forall shared route command subscription result
   . (forall model msg. Page.Page model msg shared route command subscription -> result)
  -> LoadedPage shared route command subscription
  -> result
withPage run (LoadedPage open) =
  open run
