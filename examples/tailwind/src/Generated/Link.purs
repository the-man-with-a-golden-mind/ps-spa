module Generated.Link
  ( href
  , link
  ) where

import Prelude

import Generated.Route (Route, toPath)
import PsSpa.Html as Html

href :: forall msg. Route -> Html.Attribute msg
href route =
  Html.href (toPath route)

link :: forall msg. Route -> Array (Html.Attribute msg) -> Array (Html.Html msg) -> Html.Html msg
link route attrs children =
  Html.a ([ href route ] <> attrs) children
