module PsSpa.View
  ( Document
  , map
  ) where

import Prelude
import PsSpa.Html (Html)

type Document msg =
  { title :: String
  , body :: Array (Html msg)
  }

map :: forall msgA msgB. (msgA -> msgB) -> Document msgA -> Document msgB
map lift document =
  { title: document.title
  , body: (\node -> lift <$> node) <$> document.body
  }
