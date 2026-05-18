-- | Mirror of the scaffold-emitted `Auth` module. Kept in lockstep with the
-- | template body in `scripts/cli/scaffold.mjs` (`authModuleSource`); a JS test
-- | in `tests-js/routes.test.mjs` enforces structural alignment so divergence
-- | between scaffold and mirror trips a failure on either side.
module Test.Scaffold.Auth
  ( User
  , requireUser
  , optionalUser
  ) where

import Prelude
import Data.Maybe (Maybe(..))

type User =
  { id :: String
  , name :: String
  }

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

optionalUser :: forall shared. { currentUser :: Maybe User | shared } -> Maybe User
optionalUser shared = shared.currentUser
