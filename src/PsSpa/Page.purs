module PsSpa.Page
  ( AdvancedConfig
  , ElementConfig
  , Page(..)
  , SandboxConfig
  , StaticConfig
  , Step
  , advanced
  , element
  , sandbox
  , static
  ) where

import PsSpa.Effect (Effect)
import PsSpa.View (Document)

type Step model effect =
  { model :: model
  , effect :: effect
  }

type StaticConfig msg =
  { view :: Document msg
  }

type SandboxConfig model msg =
  { init :: model
  , update :: msg -> model -> model
  , view :: model -> Document msg
  }

type ElementConfig model msg command subscription =
  { init :: Step model (Array command)
  , update :: msg -> model -> Step model (Array command)
  , view :: model -> Document msg
  , subscriptions :: model -> Array (subscription msg)
  }

type AdvancedConfig model msg shared route command subscription =
  { init :: Step model (Effect command shared route)
  , update :: msg -> model -> Step model (Effect command shared route)
  , view :: model -> Document msg
  , subscriptions :: model -> Array (subscription msg)
  }

data Page model msg shared route command subscription
  = StaticPage (StaticConfig msg)
  | SandboxPage (SandboxConfig model msg)
  | ElementPage (ElementConfig model msg command subscription)
  | AdvancedPage (AdvancedConfig model msg shared route command subscription)

static
  :: forall model msg shared route command subscription
   . StaticConfig msg
  -> Page model msg shared route command subscription
static = StaticPage

sandbox
  :: forall model msg shared route command subscription
   . SandboxConfig model msg
  -> Page model msg shared route command subscription
sandbox = SandboxPage

element
  :: forall model msg shared route command subscription
   . ElementConfig model msg command subscription
  -> Page model msg shared route command subscription
element = ElementPage

advanced
  :: forall model msg shared route command subscription
   . AdvancedConfig model msg shared route command subscription
  -> Page model msg shared route command subscription
advanced = AdvancedPage
