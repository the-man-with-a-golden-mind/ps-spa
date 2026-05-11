module PsSpa.Html
  ( Attribute(..)
  , AriaRole(..)
  , ButtonType(..)
  , Html(..)
  , a
  , a_
  , article
  , aria
  , ariaLabel
  , attr
  , button
  , button_
  , buttonType
  , className
  , class_
  , classes
  , dataAttr
  , disabled
  , div
  , div_
  , footer
  , h1
  , h1_
  , h2
  , h3
  , header
  , href
  , href_
  , id
  , img
  , main
  , main_
  , nav
  , node
  , onClick
  , p
  , p_
  , rel
  , role
  , section
  , section_
  , small
  , span
  , src
  , strong
  , target
  , text
  , titleAttr
  , ul
  , li
  ) where

import Prelude hiding (div)
import Data.String.Common (joinWith)

data Attribute msg
  = Attribute String String
  | OnClick msg

derive instance functorAttribute :: Functor Attribute

data ButtonType
  = ButtonButton
  | ButtonSubmit
  | ButtonReset

data AriaRole
  = RoleButton
  | RoleDialog
  | RoleNavigation
  | RoleMain
  | RoleStatus
  | RoleAlert

data Html msg
  = Text String
  | Element String (Array (Attribute msg)) (Array (Html msg))

instance functorHtml :: Functor Html where
  map lift html =
    case html of
      Text value ->
        Text value

      Element tag attrs children ->
        Element
          tag
          ((\attribute -> lift <$> attribute) <$> attrs)
          ((\child -> map lift child) <$> children)

text :: forall msg. String -> Html msg
text = Text

attr :: forall msg. String -> String -> Attribute msg
attr = Attribute

node :: forall msg. String -> Array (Attribute msg) -> Array (Html msg) -> Html msg
node = Element

div :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
div = node "div"

div_ :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
div_ = div

main :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
main = node "main"

main_ :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
main_ = main

section :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
section = node "section"

section_ :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
section_ = section

header :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
header = node "header"

footer :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
footer = node "footer"

nav :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
nav = node "nav"

article :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
article = node "article"

h1 :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
h1 = node "h1"

h1_ :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
h1_ = h1

h2 :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
h2 = node "h2"

h3 :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
h3 = node "h3"

p :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
p = node "p"

p_ :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
p_ = p

span :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
span = node "span"

strong :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
strong = node "strong"

small :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
small = node "small"

a :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
a = node "a"

a_ :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
a_ = a

button :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
button = node "button"

button_ :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
button_ = button

img :: forall msg. Array (Attribute msg) -> Html msg
img attrs = node "img" attrs []

ul :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
ul = node "ul"

li :: forall msg. Array (Attribute msg) -> Array (Html msg) -> Html msg
li = node "li"

className :: forall msg. String -> Attribute msg
className = Attribute "class"

class_ :: forall msg. String -> Attribute msg
class_ = className

classes :: forall msg. Array String -> Attribute msg
classes values =
  className (joinWith " " values)

href :: forall msg. String -> Attribute msg
href = Attribute "href"

href_ :: forall msg. String -> Attribute msg
href_ = href

id :: forall msg. String -> Attribute msg
id = Attribute "id"

src :: forall msg. String -> Attribute msg
src = Attribute "src"

onClick :: forall msg. msg -> Attribute msg
onClick = OnClick

buttonType :: forall msg. ButtonType -> Attribute msg
buttonType kind =
  Attribute "type" case kind of
    ButtonButton -> "button"
    ButtonSubmit -> "submit"
    ButtonReset -> "reset"

target :: forall msg. String -> Attribute msg
target = Attribute "target"

rel :: forall msg. String -> Attribute msg
rel = Attribute "rel"

titleAttr :: forall msg. String -> Attribute msg
titleAttr = Attribute "title"

dataAttr :: forall msg. String -> String -> Attribute msg
dataAttr key value =
  Attribute ("data-" <> key) value

aria :: forall msg. String -> String -> Attribute msg
aria key value =
  Attribute ("aria-" <> key) value

ariaLabel :: forall msg. String -> Attribute msg
ariaLabel =
  aria "label"

disabled :: forall msg. Boolean -> Attribute msg
disabled isDisabled =
  Attribute "disabled" if isDisabled then "disabled" else "false"

role :: forall msg. AriaRole -> Attribute msg
role currentRole =
  Attribute "role" case currentRole of
    RoleButton -> "button"
    RoleDialog -> "dialog"
    RoleNavigation -> "navigation"
    RoleMain -> "main"
    RoleStatus -> "status"
    RoleAlert -> "alert"
