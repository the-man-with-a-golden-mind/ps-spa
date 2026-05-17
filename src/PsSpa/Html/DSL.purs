-- | Record-based DSL on top of `PsSpa.Html`.
-- |
-- | Usage:
-- |
-- |   import PsSpa.Html.DSL as D
-- |
-- |   view =
-- |     D.div { className: "page" }
-- |       [ D.h1 { className: "title" } [ D.text "Hello" ]
-- |       , D.button { className: "cta", onClick: Submit } [ D.text "Click" ]
-- |       ]
-- |
-- | The DSL desugars to the same `Html` / `Attribute` ADT used by the rest of
-- | ps-spa, so it interoperates with the existing `PsSpa.Html` helpers.
module PsSpa.Html.DSL
  ( class ToAttribute
  , toAttribute
  , class FromAttrs
  , fromAttrs
  , KeyValue(..)
  , kv
  , text
  -- container elements
  , a, abbr, address, article, aside, audio
  , b, bdi, bdo, blockquote, body, button
  , canvas, caption, cite, code, colgroup
  , data_, datalist, dd, del, details, dfn, dialog, div, dl, dt
  , em
  , fieldset, figcaption, figure, footer, form
  , h1, h2, h3, h4, h5, h6, head_, header, hgroup, html
  , i, iframe, ins
  , kbd
  , label, legend, li
  , main, map_, mark, math, menu, meter
  , nav, noscript
  , object, ol, optgroup, option, output
  , p, picture, pre, progress
  , q
  , rp, rt, ruby
  , s, samp, script, search, section, select, slot, small, span, strong, style, sub, summary, sup, svg
  , table, tbody, td, template, textarea, tfoot, th, thead, time, title, tr
  , u, ul
  , var, video
  -- void (self-closing) elements
  , area, base, br, col, embed, hr, img, input, link, meta, source, track, wbr
  -- escape hatch
  , element, voidElement, keyed
  ) where

import Prelude hiding (div, sub)

import Data.Symbol (class IsSymbol, reflectSymbol)
import Data.Tuple (Tuple)
import Prim.RowList as RL
import PsSpa.Html (Attribute(..), Html(..))
import PsSpa.Html as Html
import Type.Equality (class TypeEquals, from, to)
import Type.Proxy (Proxy(..))

foreign import unsafeGetField :: forall r a. String -> Record r -> a

-- | Lightweight pair used for `dataAttrs` and `ariaAttrs` lists.
-- |
-- |   D.div { dataAttrs: [ D.kv "state" "open", D.kv "test-id" "main" ] } []
newtype KeyValue = KeyValue { key :: String, value :: String }

-- | Smart constructor for `KeyValue`.
kv :: String -> String -> KeyValue
kv key value = KeyValue { key, value }

-- | Each (field name, value type) pair produces zero or more attributes.
-- | Returning an empty array is the way to opt out — e.g. boolean attributes
-- | with the value `false` should not render at all. Instances that need to
-- | emit more than one attribute (data-* / aria-* / event composites) can.
class ToAttribute (name :: Symbol) typ msg where
  toAttribute :: Proxy name -> typ -> Array (Attribute msg)

----------------------------------------------------------------------
-- String-valued attributes (most common HTML attrs).
----------------------------------------------------------------------

instance toAttrClassName :: ToAttribute "className" String msg where
  toAttribute _ value = [ Attribute "class" value ]

instance toAttrId :: ToAttribute "id" String msg where
  toAttribute _ value = [ Attribute "id" value ]

instance toAttrStyle :: ToAttribute "style" String msg where
  toAttribute _ value = [ Attribute "style" value ]

instance toAttrTitle :: ToAttribute "title" String msg where
  toAttribute _ value = [ Attribute "title" value ]

instance toAttrRole :: ToAttribute "role" String msg where
  toAttribute _ value = [ Attribute "role" value ]

instance toAttrLang :: ToAttribute "lang" String msg where
  toAttribute _ value = [ Attribute "lang" value ]

instance toAttrDir :: ToAttribute "dir" String msg where
  toAttribute _ value = [ Attribute "dir" value ]

instance toAttrSlotName :: ToAttribute "slot" String msg where
  toAttribute _ value = [ Attribute "slot" value ]

instance toAttrPart :: ToAttribute "part" String msg where
  toAttribute _ value = [ Attribute "part" value ]

instance toAttrTabIndex :: ToAttribute "tabIndex" Int msg where
  toAttribute _ value = [ Attribute "tabindex" (show value) ]

instance toAttrTabIndexStr :: ToAttribute "tabIndex" String msg where
  toAttribute _ value = [ Attribute "tabindex" value ]

-- Links
instance toAttrHref :: ToAttribute "href" String msg where
  toAttribute _ value = [ Attribute "href" value ]

instance toAttrTarget :: ToAttribute "target" String msg where
  toAttribute _ value = [ Attribute "target" value ]

instance toAttrRel :: ToAttribute "rel" String msg where
  toAttribute _ value = [ Attribute "rel" value ]

instance toAttrDownload :: ToAttribute "download" String msg where
  toAttribute _ value = [ Attribute "download" value ]

instance toAttrHreflang :: ToAttribute "hrefLang" String msg where
  toAttribute _ value = [ Attribute "hreflang" value ]

instance toAttrPing :: ToAttribute "ping" String msg where
  toAttribute _ value = [ Attribute "ping" value ]

instance toAttrReferrerPolicy :: ToAttribute "referrerPolicy" String msg where
  toAttribute _ value = [ Attribute "referrerpolicy" value ]

-- Media
instance toAttrSrc :: ToAttribute "src" String msg where
  toAttribute _ value = [ Attribute "src" value ]

instance toAttrSrcSet :: ToAttribute "srcSet" String msg where
  toAttribute _ value = [ Attribute "srcset" value ]

instance toAttrSizes :: ToAttribute "sizes" String msg where
  toAttribute _ value = [ Attribute "sizes" value ]

instance toAttrAlt :: ToAttribute "alt" String msg where
  toAttribute _ value = [ Attribute "alt" value ]

instance toAttrPoster :: ToAttribute "poster" String msg where
  toAttribute _ value = [ Attribute "poster" value ]

instance toAttrPreload :: ToAttribute "preload" String msg where
  toAttribute _ value = [ Attribute "preload" value ]

instance toAttrCrossOrigin :: ToAttribute "crossOrigin" String msg where
  toAttribute _ value = [ Attribute "crossorigin" value ]

instance toAttrLoading :: ToAttribute "loading" String msg where
  toAttribute _ value = [ Attribute "loading" value ]

instance toAttrDecoding :: ToAttribute "decoding" String msg where
  toAttribute _ value = [ Attribute "decoding" value ]

instance toAttrKind :: ToAttribute "kind" String msg where
  toAttribute _ value = [ Attribute "kind" value ]

instance toAttrSrcLang :: ToAttribute "srcLang" String msg where
  toAttribute _ value = [ Attribute "srclang" value ]

instance toAttrLabelText :: ToAttribute "label" String msg where
  toAttribute _ value = [ Attribute "label" value ]

-- Forms / inputs
instance toAttrType :: ToAttribute "type_" String msg where
  toAttribute _ value = [ Attribute "type" value ]

instance toAttrName :: ToAttribute "name" String msg where
  toAttribute _ value = [ Attribute "name" value ]

instance toAttrValueStr :: ToAttribute "value" String msg where
  toAttribute _ value = [ Attribute "value" value ]

instance toAttrValueInt :: ToAttribute "value" Int msg where
  toAttribute _ value = [ Attribute "value" (show value) ]

instance toAttrDefaultValue :: ToAttribute "defaultValue" String msg where
  toAttribute _ value = [ Attribute "value" value ]

instance toAttrPlaceholder :: ToAttribute "placeholder" String msg where
  toAttribute _ value = [ Attribute "placeholder" value ]

instance toAttrHtmlFor :: ToAttribute "htmlFor" String msg where
  toAttribute _ value = [ Attribute "for" value ]

instance toAttrAction :: ToAttribute "action" String msg where
  toAttribute _ value = [ Attribute "action" value ]

instance toAttrMethod :: ToAttribute "method" String msg where
  toAttribute _ value = [ Attribute "method" value ]

instance toAttrEncType :: ToAttribute "encType" String msg where
  toAttribute _ value = [ Attribute "enctype" value ]

instance toAttrAccept :: ToAttribute "accept" String msg where
  toAttribute _ value = [ Attribute "accept" value ]

instance toAttrAcceptCharset :: ToAttribute "acceptCharset" String msg where
  toAttribute _ value = [ Attribute "accept-charset" value ]

instance toAttrAutoComplete :: ToAttribute "autoComplete" String msg where
  toAttribute _ value = [ Attribute "autocomplete" value ]

instance toAttrAutoCapitalize :: ToAttribute "autoCapitalize" String msg where
  toAttribute _ value = [ Attribute "autocapitalize" value ]

instance toAttrInputMode :: ToAttribute "inputMode" String msg where
  toAttribute _ value = [ Attribute "inputmode" value ]

instance toAttrPattern :: ToAttribute "pattern" String msg where
  toAttribute _ value = [ Attribute "pattern" value ]

instance toAttrFormAttr :: ToAttribute "form" String msg where
  toAttribute _ value = [ Attribute "form" value ]

instance toAttrFormAction :: ToAttribute "formAction" String msg where
  toAttribute _ value = [ Attribute "formaction" value ]

instance toAttrFormMethod :: ToAttribute "formMethod" String msg where
  toAttribute _ value = [ Attribute "formmethod" value ]

instance toAttrFormEncType :: ToAttribute "formEncType" String msg where
  toAttribute _ value = [ Attribute "formenctype" value ]

instance toAttrFormTarget :: ToAttribute "formTarget" String msg where
  toAttribute _ value = [ Attribute "formtarget" value ]

instance toAttrMaxStr :: ToAttribute "max" String msg where
  toAttribute _ value = [ Attribute "max" value ]

instance toAttrMaxInt :: ToAttribute "max" Int msg where
  toAttribute _ value = [ Attribute "max" (show value) ]

instance toAttrMinStr :: ToAttribute "min" String msg where
  toAttribute _ value = [ Attribute "min" value ]

instance toAttrMinInt :: ToAttribute "min" Int msg where
  toAttribute _ value = [ Attribute "min" (show value) ]

instance toAttrStepStr :: ToAttribute "step" String msg where
  toAttribute _ value = [ Attribute "step" value ]

instance toAttrStepInt :: ToAttribute "step" Int msg where
  toAttribute _ value = [ Attribute "step" (show value) ]

instance toAttrMaxLength :: ToAttribute "maxLength" Int msg where
  toAttribute _ value = [ Attribute "maxlength" (show value) ]

instance toAttrMinLength :: ToAttribute "minLength" Int msg where
  toAttribute _ value = [ Attribute "minlength" (show value) ]

instance toAttrSize :: ToAttribute "size" Int msg where
  toAttribute _ value = [ Attribute "size" (show value) ]

instance toAttrRows :: ToAttribute "rows" Int msg where
  toAttribute _ value = [ Attribute "rows" (show value) ]

instance toAttrCols :: ToAttribute "cols" Int msg where
  toAttribute _ value = [ Attribute "cols" (show value) ]

instance toAttrWrap :: ToAttribute "wrap" String msg where
  toAttribute _ value = [ Attribute "wrap" value ]

-- Dimensions
instance toAttrWidthStr :: ToAttribute "width" String msg where
  toAttribute _ value = [ Attribute "width" value ]

instance toAttrWidthInt :: ToAttribute "width" Int msg where
  toAttribute _ value = [ Attribute "width" (show value) ]

instance toAttrHeightStr :: ToAttribute "height" String msg where
  toAttribute _ value = [ Attribute "height" value ]

instance toAttrHeightInt :: ToAttribute "height" Int msg where
  toAttribute _ value = [ Attribute "height" (show value) ]

-- Tables
instance toAttrColSpan :: ToAttribute "colSpan" Int msg where
  toAttribute _ value = [ Attribute "colspan" (show value) ]

instance toAttrRowSpan :: ToAttribute "rowSpan" Int msg where
  toAttribute _ value = [ Attribute "rowspan" (show value) ]

instance toAttrSpanAttr :: ToAttribute "spanCount" Int msg where
  toAttribute _ value = [ Attribute "span" (show value) ]

instance toAttrHeaders :: ToAttribute "headers" String msg where
  toAttribute _ value = [ Attribute "headers" value ]

instance toAttrScope :: ToAttribute "scope" String msg where
  toAttribute _ value = [ Attribute "scope" value ]

-- Meta / document
instance toAttrCharset :: ToAttribute "charset" String msg where
  toAttribute _ value = [ Attribute "charset" value ]

instance toAttrContent :: ToAttribute "content" String msg where
  toAttribute _ value = [ Attribute "content" value ]

instance toAttrHttpEquiv :: ToAttribute "httpEquiv" String msg where
  toAttribute _ value = [ Attribute "http-equiv" value ]

instance toAttrIcon :: ToAttribute "icon" String msg where
  toAttribute _ value = [ Attribute "icon" value ]

-- Misc / lists
instance toAttrStartStr :: ToAttribute "start" String msg where
  toAttribute _ value = [ Attribute "start" value ]

instance toAttrStartInt :: ToAttribute "start" Int msg where
  toAttribute _ value = [ Attribute "start" (show value) ]

instance toAttrReversed :: ToAttribute "reversed" Boolean msg where
  toAttribute _ true = [ Attribute "reversed" "" ]
  toAttribute _ false = []

instance toAttrList :: ToAttribute "list" String msg where
  toAttribute _ value = [ Attribute "list" value ]

-- Aria (most common — for less common ones, drop down to PsSpa.Html.aria)
instance toAttrAriaLabel :: ToAttribute "ariaLabel" String msg where
  toAttribute _ value = [ Attribute "aria-label" value ]

instance toAttrAriaLabelledBy :: ToAttribute "ariaLabelledBy" String msg where
  toAttribute _ value = [ Attribute "aria-labelledby" value ]

instance toAttrAriaDescribedBy :: ToAttribute "ariaDescribedBy" String msg where
  toAttribute _ value = [ Attribute "aria-describedby" value ]

instance toAttrAriaControls :: ToAttribute "ariaControls" String msg where
  toAttribute _ value = [ Attribute "aria-controls" value ]

instance toAttrAriaCurrent :: ToAttribute "ariaCurrent" String msg where
  toAttribute _ value = [ Attribute "aria-current" value ]

instance toAttrAriaLive :: ToAttribute "ariaLive" String msg where
  toAttribute _ value = [ Attribute "aria-live" value ]

instance toAttrAriaHiddenBool :: ToAttribute "ariaHidden" Boolean msg where
  toAttribute _ true = [ Attribute "aria-hidden" "true" ]
  toAttribute _ false = [ Attribute "aria-hidden" "false" ]

instance toAttrAriaExpandedBool :: ToAttribute "ariaExpanded" Boolean msg where
  toAttribute _ true = [ Attribute "aria-expanded" "true" ]
  toAttribute _ false = [ Attribute "aria-expanded" "false" ]

instance toAttrAriaSelectedBool :: ToAttribute "ariaSelected" Boolean msg where
  toAttribute _ true = [ Attribute "aria-selected" "true" ]
  toAttribute _ false = [ Attribute "aria-selected" "false" ]

instance toAttrAriaPressedBool :: ToAttribute "ariaPressed" Boolean msg where
  toAttribute _ true = [ Attribute "aria-pressed" "true" ]
  toAttribute _ false = [ Attribute "aria-pressed" "false" ]

instance toAttrAriaDisabledBool :: ToAttribute "ariaDisabled" Boolean msg where
  toAttribute _ true = [ Attribute "aria-disabled" "true" ]
  toAttribute _ false = [ Attribute "aria-disabled" "false" ]

----------------------------------------------------------------------
-- Boolean attributes — included only when `true`.
----------------------------------------------------------------------

instance toAttrDisabled :: ToAttribute "disabled" Boolean msg where
  toAttribute _ true = [ Attribute "disabled" "disabled" ]
  toAttribute _ false = []

instance toAttrChecked :: ToAttribute "checked" Boolean msg where
  toAttribute _ true = [ Attribute "checked" "checked" ]
  toAttribute _ false = []

instance toAttrReadOnly :: ToAttribute "readOnly" Boolean msg where
  toAttribute _ true = [ Attribute "readonly" "readonly" ]
  toAttribute _ false = []

instance toAttrRequired :: ToAttribute "required" Boolean msg where
  toAttribute _ true = [ Attribute "required" "required" ]
  toAttribute _ false = []

instance toAttrAutoFocus :: ToAttribute "autoFocus" Boolean msg where
  toAttribute _ true = [ Attribute "autofocus" "autofocus" ]
  toAttribute _ false = []

instance toAttrMultiple :: ToAttribute "multiple" Boolean msg where
  toAttribute _ true = [ Attribute "multiple" "multiple" ]
  toAttribute _ false = []

instance toAttrNoValidate :: ToAttribute "noValidate" Boolean msg where
  toAttribute _ true = [ Attribute "novalidate" "novalidate" ]
  toAttribute _ false = []

instance toAttrFormNoValidate :: ToAttribute "formNoValidate" Boolean msg where
  toAttribute _ true = [ Attribute "formnovalidate" "formnovalidate" ]
  toAttribute _ false = []

instance toAttrHidden :: ToAttribute "hidden" Boolean msg where
  toAttribute _ true = [ Attribute "hidden" "hidden" ]
  toAttribute _ false = []

instance toAttrSelected :: ToAttribute "selected" Boolean msg where
  toAttribute _ true = [ Attribute "selected" "selected" ]
  toAttribute _ false = []

instance toAttrDefaultChecked :: ToAttribute "defaultChecked" Boolean msg where
  toAttribute _ true = [ Attribute "checked" "checked" ]
  toAttribute _ false = []

instance toAttrDefaultSelected :: ToAttribute "defaultSelected" Boolean msg where
  toAttribute _ true = [ Attribute "selected" "selected" ]
  toAttribute _ false = []

instance toAttrOpen :: ToAttribute "open" Boolean msg where
  toAttribute _ true = [ Attribute "open" "open" ]
  toAttribute _ false = []

instance toAttrControls :: ToAttribute "controls" Boolean msg where
  toAttribute _ true = [ Attribute "controls" "controls" ]
  toAttribute _ false = []

instance toAttrAutoplay :: ToAttribute "autoPlay" Boolean msg where
  toAttribute _ true = [ Attribute "autoplay" "autoplay" ]
  toAttribute _ false = []

instance toAttrLoop :: ToAttribute "loop" Boolean msg where
  toAttribute _ true = [ Attribute "loop" "loop" ]
  toAttribute _ false = []

instance toAttrMuted :: ToAttribute "muted" Boolean msg where
  toAttribute _ true = [ Attribute "muted" "muted" ]
  toAttribute _ false = []

instance toAttrPlaysInline :: ToAttribute "playsInline" Boolean msg where
  toAttribute _ true = [ Attribute "playsinline" "playsinline" ]
  toAttribute _ false = []

instance toAttrAsync :: ToAttribute "async" Boolean msg where
  toAttribute _ true = [ Attribute "async" "async" ]
  toAttribute _ false = []

instance toAttrDefer :: ToAttribute "defer" Boolean msg where
  toAttribute _ true = [ Attribute "defer" "defer" ]
  toAttribute _ false = []

instance toAttrIsMap :: ToAttribute "isMap" Boolean msg where
  toAttribute _ true = [ Attribute "ismap" "ismap" ]
  toAttribute _ false = []

instance toAttrContentEditableBool :: ToAttribute "contentEditable" Boolean msg where
  toAttribute _ true = [ Attribute "contenteditable" "true" ]
  toAttribute _ false = [ Attribute "contenteditable" "false" ]

instance toAttrSpellCheckBool :: ToAttribute "spellCheck" Boolean msg where
  toAttribute _ true = [ Attribute "spellcheck" "true" ]
  toAttribute _ false = [ Attribute "spellcheck" "false" ]

instance toAttrDraggableBool :: ToAttribute "draggable" Boolean msg where
  toAttribute _ true = [ Attribute "draggable" "true" ]
  toAttribute _ false = [ Attribute "draggable" "false" ]

instance toAttrTranslate :: ToAttribute "translate" String msg where
  toAttribute _ value = [ Attribute "translate" value ]

----------------------------------------------------------------------
-- Events. Only `onClick` is supported by the current Browser.js;
-- adding more event handlers requires extending the `Attribute` ADT.
----------------------------------------------------------------------

-- Use TypeEquals so the solver propagates the field's value type into the
-- producing Html's msg parameter. Without this, `{ onClick: Submit }` would
-- not pin the outer Html msg parameter and instance resolution fails.
instance toAttrOnClick :: TypeEquals typ msg => ToAttribute "onClick" typ msg where
  toAttribute _ value = [ OnClick (to value) ]

instance toAttrOnDoubleClick :: TypeEquals typ msg => ToAttribute "onDoubleClick" typ msg where
  toAttribute _ value = [ Html.onDoubleClick (to value) ]

instance toAttrOnSubmit :: TypeEquals typ msg => ToAttribute "onSubmit" typ msg where
  toAttribute _ value = [ Html.onSubmit (to value) ]

instance toAttrOnFocus :: TypeEquals typ msg => ToAttribute "onFocus" typ msg where
  toAttribute _ value = [ Html.onFocus (to value) ]

instance toAttrOnBlur :: TypeEquals typ msg => ToAttribute "onBlur" typ msg where
  toAttribute _ value = [ Html.onBlur (to value) ]

instance toAttrOnMouseEnter :: TypeEquals typ msg => ToAttribute "onMouseEnter" typ msg where
  toAttribute _ value = [ Html.onMouseEnter (to value) ]

instance toAttrOnMouseLeave :: TypeEquals typ msg => ToAttribute "onMouseLeave" typ msg where
  toAttribute _ value = [ Html.onMouseLeave (to value) ]

-- Handlers that take a string payload from the event target/key. Their typ
-- must be `String -> msg`, so we equate the typ to that shape via TypeEquals.
instance toAttrOnInput
  :: TypeEquals (String -> msg) f
  => ToAttribute "onInput" f msg where
  toAttribute _ f = [ Html.onInput (from f) ]

instance toAttrOnChange
  :: TypeEquals (String -> msg) f
  => ToAttribute "onChange" f msg where
  toAttribute _ f = [ Html.onChange (from f) ]

instance toAttrOnKeyDown
  :: TypeEquals (String -> msg) f
  => ToAttribute "onKeyDown" f msg where
  toAttribute _ f = [ Html.onKeyDown (from f) ]

instance toAttrOnKeyUp
  :: TypeEquals (String -> msg) f
  => ToAttribute "onKeyUp" f msg where
  toAttribute _ f = [ Html.onKeyUp (from f) ]

----------------------------------------------------------------------
-- Additional global attributes.
----------------------------------------------------------------------

instance toAttrAccessKey :: ToAttribute "accessKey" String msg where
  toAttribute _ value = [ Attribute "accesskey" value ]

instance toAttrEnterKeyHint :: ToAttribute "enterKeyHint" String msg where
  toAttribute _ value = [ Attribute "enterkeyhint" value ]

instance toAttrPopover :: ToAttribute "popover" String msg where
  toAttribute _ value = [ Attribute "popover" value ]

instance toAttrNonce :: ToAttribute "nonce" String msg where
  toAttribute _ value = [ Attribute "nonce" value ]

instance toAttrIsAttr :: ToAttribute "is" String msg where
  toAttribute _ value = [ Attribute "is" value ]

instance toAttrInert :: ToAttribute "inert" Boolean msg where
  toAttribute _ true = [ Attribute "inert" "inert" ]
  toAttribute _ false = []

instance toAttrItemProp :: ToAttribute "itemProp" String msg where
  toAttribute _ value = [ Attribute "itemprop" value ]

instance toAttrItemId :: ToAttribute "itemId" String msg where
  toAttribute _ value = [ Attribute "itemid" value ]

instance toAttrItemRef :: ToAttribute "itemRef" String msg where
  toAttribute _ value = [ Attribute "itemref" value ]

instance toAttrItemType :: ToAttribute "itemType" String msg where
  toAttribute _ value = [ Attribute "itemtype" value ]

instance toAttrItemScope :: ToAttribute "itemScope" Boolean msg where
  toAttribute _ true = [ Attribute "itemscope" "itemscope" ]
  toAttribute _ false = []

----------------------------------------------------------------------
-- Additional ARIA attributes — the rest of WAI-ARIA 1.2.
----------------------------------------------------------------------

-- Properties
instance toAttrAriaActiveDescendant :: ToAttribute "ariaActiveDescendant" String msg where
  toAttribute _ value = [ Attribute "aria-activedescendant" value ]

instance toAttrAriaAtomic :: ToAttribute "ariaAtomic" Boolean msg where
  toAttribute _ true = [ Attribute "aria-atomic" "true" ]
  toAttribute _ false = [ Attribute "aria-atomic" "false" ]

instance toAttrAriaAutoComplete :: ToAttribute "ariaAutoComplete" String msg where
  toAttribute _ value = [ Attribute "aria-autocomplete" value ]

instance toAttrAriaBusy :: ToAttribute "ariaBusy" Boolean msg where
  toAttribute _ true = [ Attribute "aria-busy" "true" ]
  toAttribute _ false = [ Attribute "aria-busy" "false" ]

instance toAttrAriaChecked :: ToAttribute "ariaChecked" String msg where
  toAttribute _ value = [ Attribute "aria-checked" value ]

instance toAttrAriaColCount :: ToAttribute "ariaColCount" Int msg where
  toAttribute _ value = [ Attribute "aria-colcount" (show value) ]

instance toAttrAriaColIndex :: ToAttribute "ariaColIndex" Int msg where
  toAttribute _ value = [ Attribute "aria-colindex" (show value) ]

instance toAttrAriaColSpan :: ToAttribute "ariaColSpan" Int msg where
  toAttribute _ value = [ Attribute "aria-colspan" (show value) ]

instance toAttrAriaDetails :: ToAttribute "ariaDetails" String msg where
  toAttribute _ value = [ Attribute "aria-details" value ]

instance toAttrAriaErrorMessage :: ToAttribute "ariaErrorMessage" String msg where
  toAttribute _ value = [ Attribute "aria-errormessage" value ]

instance toAttrAriaFlowTo :: ToAttribute "ariaFlowTo" String msg where
  toAttribute _ value = [ Attribute "aria-flowto" value ]

instance toAttrAriaHasPopup :: ToAttribute "ariaHasPopup" String msg where
  toAttribute _ value = [ Attribute "aria-haspopup" value ]

instance toAttrAriaInvalid :: ToAttribute "ariaInvalid" String msg where
  toAttribute _ value = [ Attribute "aria-invalid" value ]

instance toAttrAriaKeyShortcuts :: ToAttribute "ariaKeyShortcuts" String msg where
  toAttribute _ value = [ Attribute "aria-keyshortcuts" value ]

instance toAttrAriaLevel :: ToAttribute "ariaLevel" Int msg where
  toAttribute _ value = [ Attribute "aria-level" (show value) ]

instance toAttrAriaModal :: ToAttribute "ariaModal" Boolean msg where
  toAttribute _ true = [ Attribute "aria-modal" "true" ]
  toAttribute _ false = [ Attribute "aria-modal" "false" ]

instance toAttrAriaMultiLine :: ToAttribute "ariaMultiLine" Boolean msg where
  toAttribute _ true = [ Attribute "aria-multiline" "true" ]
  toAttribute _ false = [ Attribute "aria-multiline" "false" ]

instance toAttrAriaMultiSelectable :: ToAttribute "ariaMultiSelectable" Boolean msg where
  toAttribute _ true = [ Attribute "aria-multiselectable" "true" ]
  toAttribute _ false = [ Attribute "aria-multiselectable" "false" ]

instance toAttrAriaOrientation :: ToAttribute "ariaOrientation" String msg where
  toAttribute _ value = [ Attribute "aria-orientation" value ]

instance toAttrAriaOwns :: ToAttribute "ariaOwns" String msg where
  toAttribute _ value = [ Attribute "aria-owns" value ]

instance toAttrAriaPlaceholder :: ToAttribute "ariaPlaceholder" String msg where
  toAttribute _ value = [ Attribute "aria-placeholder" value ]

instance toAttrAriaPosInSet :: ToAttribute "ariaPosInSet" Int msg where
  toAttribute _ value = [ Attribute "aria-posinset" (show value) ]

instance toAttrAriaReadOnly :: ToAttribute "ariaReadOnly" Boolean msg where
  toAttribute _ true = [ Attribute "aria-readonly" "true" ]
  toAttribute _ false = [ Attribute "aria-readonly" "false" ]

instance toAttrAriaRelevant :: ToAttribute "ariaRelevant" String msg where
  toAttribute _ value = [ Attribute "aria-relevant" value ]

instance toAttrAriaRequired :: ToAttribute "ariaRequired" Boolean msg where
  toAttribute _ true = [ Attribute "aria-required" "true" ]
  toAttribute _ false = [ Attribute "aria-required" "false" ]

instance toAttrAriaRoleDescription :: ToAttribute "ariaRoleDescription" String msg where
  toAttribute _ value = [ Attribute "aria-roledescription" value ]

instance toAttrAriaRowCount :: ToAttribute "ariaRowCount" Int msg where
  toAttribute _ value = [ Attribute "aria-rowcount" (show value) ]

instance toAttrAriaRowIndex :: ToAttribute "ariaRowIndex" Int msg where
  toAttribute _ value = [ Attribute "aria-rowindex" (show value) ]

instance toAttrAriaRowSpan :: ToAttribute "ariaRowSpan" Int msg where
  toAttribute _ value = [ Attribute "aria-rowspan" (show value) ]

instance toAttrAriaSetSize :: ToAttribute "ariaSetSize" Int msg where
  toAttribute _ value = [ Attribute "aria-setsize" (show value) ]

instance toAttrAriaSort :: ToAttribute "ariaSort" String msg where
  toAttribute _ value = [ Attribute "aria-sort" value ]

instance toAttrAriaValueMaxInt :: ToAttribute "ariaValueMax" Int msg where
  toAttribute _ value = [ Attribute "aria-valuemax" (show value) ]

instance toAttrAriaValueMinInt :: ToAttribute "ariaValueMin" Int msg where
  toAttribute _ value = [ Attribute "aria-valuemin" (show value) ]

instance toAttrAriaValueNowInt :: ToAttribute "ariaValueNow" Int msg where
  toAttribute _ value = [ Attribute "aria-valuenow" (show value) ]

instance toAttrAriaValueText :: ToAttribute "ariaValueText" String msg where
  toAttribute _ value = [ Attribute "aria-valuetext" value ]

----------------------------------------------------------------------
-- Generic data-* and aria-* via records (escape hatch for the long tail).
-- Each entry expands to a separate Attribute, so:
--
--   D.div { dataAttrs: [{ key: "state", value: "open" }, { key: "test-id", value: "main" }] } []
--
-- emits both `data-state="open"` and `data-test-id="main"`.
----------------------------------------------------------------------

instance toAttrDataAttrs
  :: ToAttribute "dataAttrs" (Array KeyValue) msg where
  toAttribute _ pairs = map (\(KeyValue p) -> Attribute ("data-" <> p.key) p.value) pairs

instance toAttrAriaAttrs
  :: ToAttribute "ariaAttrs" (Array KeyValue) msg where
  toAttribute _ pairs = map (\(KeyValue p) -> Attribute ("aria-" <> p.key) p.value) pairs

----------------------------------------------------------------------
-- RowList → Array (Attribute msg) iterator.
----------------------------------------------------------------------

class FromAttrs (rl :: RL.RowList Type) (r :: Row Type) msg where
  fromAttrs :: Proxy rl -> Record r -> Array (Attribute msg)

instance fromAttrsNil :: FromAttrs RL.Nil r msg where
  fromAttrs _ _ = []

instance fromAttrsCons ::
  ( IsSymbol name
  , ToAttribute name typ msg
  , FromAttrs rest r msg
  ) =>
  FromAttrs (RL.Cons name typ rest) r msg where
  fromAttrs _ rec =
    let
      nameProxy = (Proxy :: Proxy name)
      key = reflectSymbol nameProxy
      typedValue :: typ
      typedValue = unsafeGetField key rec
      remainder = fromAttrs (Proxy :: Proxy rest) rec
    in
      toAttribute nameProxy typedValue <> remainder

----------------------------------------------------------------------
-- Generic constructors. Specific elements are thin wrappers around these.
----------------------------------------------------------------------

element ::
  forall r rl msg.
  RL.RowToList r rl =>
  FromAttrs rl r msg =>
  String -> Record r -> Array (Html msg) -> Html msg
element tag attrs children =
  Element tag (fromAttrs (Proxy :: Proxy rl) attrs) children

voidElement ::
  forall r rl msg.
  RL.RowToList r rl =>
  FromAttrs rl r msg =>
  String -> Record r -> Html msg
voidElement tag attrs =
  Element tag (fromAttrs (Proxy :: Proxy rl) attrs) []

-- | Record-attr flavour of `Html.keyed`. Use this when you want stable per-row
-- | DOM identity across reorders (drag-and-drop, virtualisation, list sorts).
-- |
-- |   D.keyed "ul" { className: "list" }
-- |     [ Tuple "todo-1" (D.li { className: "row" } [ D.text "A" ])
-- |     , Tuple "todo-2" (D.li { className: "row" } [ D.text "B" ])
-- |     ]
keyed ::
  forall r rl msg.
  RL.RowToList r rl =>
  FromAttrs rl r msg =>
  String -> Record r -> Array (Tuple String (Html msg)) -> Html msg
keyed tag attrs children =
  Html.keyed tag (fromAttrs (Proxy :: Proxy rl) attrs) children

text :: forall msg. String -> Html msg
text = Text

----------------------------------------------------------------------
-- HTML5 elements — container (attrs + children).
----------------------------------------------------------------------

a :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
a = element "a"

abbr :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
abbr = element "abbr"

address :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
address = element "address"

article :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
article = element "article"

aside :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
aside = element "aside"

audio :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
audio = element "audio"

b :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
b = element "b"

bdi :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
bdi = element "bdi"

bdo :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
bdo = element "bdo"

blockquote :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
blockquote = element "blockquote"

body :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
body = element "body"

button :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
button = element "button"

canvas :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
canvas = element "canvas"

caption :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
caption = element "caption"

cite :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
cite = element "cite"

code :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
code = element "code"

colgroup :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
colgroup = element "colgroup"

data_ :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
data_ = element "data"

datalist :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
datalist = element "datalist"

dd :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
dd = element "dd"

del :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
del = element "del"

details :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
details = element "details"

dfn :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
dfn = element "dfn"

dialog :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
dialog = element "dialog"

div :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
div = element "div"

dl :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
dl = element "dl"

dt :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
dt = element "dt"

em :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
em = element "em"

fieldset :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
fieldset = element "fieldset"

figcaption :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
figcaption = element "figcaption"

figure :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
figure = element "figure"

footer :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
footer = element "footer"

form :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
form = element "form"

h1 :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
h1 = element "h1"

h2 :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
h2 = element "h2"

h3 :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
h3 = element "h3"

h4 :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
h4 = element "h4"

h5 :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
h5 = element "h5"

h6 :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
h6 = element "h6"

head_ :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
head_ = element "head"

header :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
header = element "header"

hgroup :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
hgroup = element "hgroup"

html :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
html = element "html"

i :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
i = element "i"

iframe :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
iframe = element "iframe"

ins :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
ins = element "ins"

kbd :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
kbd = element "kbd"

label :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
label = element "label"

legend :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
legend = element "legend"

li :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
li = element "li"

main :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
main = element "main"

map_ :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
map_ = element "map"

mark :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
mark = element "mark"

math :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
math = element "math"

menu :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
menu = element "menu"

meter :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
meter = element "meter"

nav :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
nav = element "nav"

noscript :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
noscript = element "noscript"

object :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
object = element "object"

ol :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
ol = element "ol"

optgroup :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
optgroup = element "optgroup"

option :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
option = element "option"

output :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
output = element "output"

p :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
p = element "p"

picture :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
picture = element "picture"

pre :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
pre = element "pre"

progress :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
progress = element "progress"

q :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
q = element "q"

rp :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
rp = element "rp"

rt :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
rt = element "rt"

ruby :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
ruby = element "ruby"

s :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
s = element "s"

samp :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
samp = element "samp"

script :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
script = element "script"

search :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
search = element "search"

section :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
section = element "section"

select :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
select = element "select"

slot :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
slot = element "slot"

small :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
small = element "small"

span :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
span = element "span"

strong :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
strong = element "strong"

style :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
style = element "style"

sub :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
sub = element "sub"

summary :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
summary = element "summary"

sup :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
sup = element "sup"

svg :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
svg = element "svg"

table :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
table = element "table"

tbody :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
tbody = element "tbody"

td :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
td = element "td"

template :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
template = element "template"

textarea :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
textarea = element "textarea"

tfoot :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
tfoot = element "tfoot"

th :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
th = element "th"

thead :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
thead = element "thead"

time :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
time = element "time"

title :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
title = element "title"

tr :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
tr = element "tr"

u :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
u = element "u"

ul :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
ul = element "ul"

var :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
var = element "var"

video :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Array (Html msg) -> Html msg
video = element "video"

----------------------------------------------------------------------
-- HTML5 void elements — attrs only, no children.
----------------------------------------------------------------------

area :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
area = voidElement "area"

base :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
base = voidElement "base"

br :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
br = voidElement "br"

col :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
col = voidElement "col"

embed :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
embed = voidElement "embed"

hr :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
hr = voidElement "hr"

img :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
img = voidElement "img"

input :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
input = voidElement "input"

link :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
link = voidElement "link"

meta :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
meta = voidElement "meta"

source :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
source = voidElement "source"

track :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
track = voidElement "track"

wbr :: forall r rl msg. RL.RowToList r rl => FromAttrs rl r msg => Record r -> Html msg
wbr = voidElement "wbr"
