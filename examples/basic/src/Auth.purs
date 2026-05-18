module Auth
  ( User
  , requireUser
  , optionalUser
  ) where

import Prelude
import Data.Maybe (Maybe(..))

-- | The minimal logged-in user shape. Extend with whatever your app actually
-- | needs (email, roles, avatar, …) and mirror the extension in Shared.
type User =
  { id :: String
  , name :: String
  }

-- | Reusable protect guard: returns `Just loginRoute` when shared state has
-- | no current user. Wire into a page's `protect`:
-- |
-- |     import Auth as Auth
-- |     import Generated.Route (Route(..))
-- |
-- |     protect = Auth.requireUser Login
-- |
-- | The signature is row-polymorphic in `shared`, so adding fields to Shared
-- | doesn't break this helper.
requireUser
  :: forall request route shared
   . route
  -> { currentUser :: Maybe User | shared }
  -> request
  -> Maybe route
requireUser loginRoute shared _request =
  case shared.currentUser of
    Just _user -> Nothing
    Nothing -> Just loginRoute

-- | Read the optional logged-in user out of shared state. Handy for views that
-- | show different UI for guests vs. signed-in users.
optionalUser :: forall shared. { currentUser :: Maybe User | shared } -> Maybe User
optionalUser shared = shared.currentUser
