module Generated.Link
  ( href
  , link
  , linkAttrs
  ) where

import Prelude

import Generated.Route (Route, toPath)
import Prim.RowList as RL
import PsSpa.Html (Attribute(..), Html(..))
import PsSpa.Html as Html
import PsSpa.Html.DSL as DSL
import Type.Proxy (Proxy(..))

href :: forall msg. Route -> Attribute msg
href route =
  Html.href (toPath route)

-- | Type-safe internal link with DSL record-style attributes. Use this in new
-- | code: `Link.link Index { className: "back" } [ DSL.text "Back" ]`.
link
  :: forall r rl msg
   . RL.RowToList r rl
  => DSL.FromAttrs rl r msg
  => Route
  -> Record r
  -> Array (Html msg)
  -> Html msg
link route attrs children =
  Element "a"
    ([ Attribute "href" (toPath route) ] <> DSL.fromAttrs (Proxy :: Proxy rl) attrs)
    children

-- | Legacy array-style link, for pages still using the `PsSpa.Html` helpers.
linkAttrs
  :: forall msg
   . Route
  -> Array (Attribute msg)
  -> Array (Html msg)
  -> Html msg
linkAttrs route attrs children =
  Html.a ([ href route ] <> attrs) children
