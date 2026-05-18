-- | Mirror of the scaffold-emitted `Shared` module. Kept in lockstep with the
-- | template body in `scripts/cli/scaffold.mjs` (`sharedModuleSource`); a JS
-- | test in `tests-js/routes.test.mjs` enforces structural alignment.
module Test.Scaffold.Shared
  ( Shared
  , init
  ) where

import Data.Maybe (Maybe(..))
import Test.Scaffold.Auth (User)

type Shared =
  { currentUser :: Maybe User
  }

init :: Shared
init =
  { currentUser: Nothing
  }
