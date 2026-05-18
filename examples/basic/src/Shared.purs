module Shared
  ( Shared
  , init
  ) where

import Data.Maybe (Maybe(..))
import Auth (User)

-- | App-wide state visible to every page and protect guard. The runtime hands
-- | this record to pages as the polymorphic `shared` parameter; advanced
-- | pages can emit a new value via `Effect.fromShared` to trigger a re-render
-- | with fresh shared state.
-- |
-- | Extend this record with whatever your app needs (theme, feature flags,
-- | session token, …). Pages that need a field just constrain their protect
-- | / view signatures to the relevant row.
type Shared =
  { currentUser :: Maybe User
  }

-- | Initial Shared value handed to `App.startWith { initialShared: Shared.init,
-- | … }`. Replace `currentUser: Nothing` with whatever you read out of
-- | localStorage / cookies / SSR payload at boot.
init :: Shared
init =
  { currentUser: Nothing
  }
