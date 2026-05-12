module Generated.Pages
  ( PageMeta
  , loadPage
  , pageForRoute
  , pages
  ) where

import Data.Maybe (Maybe(..))
import Generated.Route (Request, Route(..))
import PsSpa.LoadResult as LoadResult
import PsSpa.LoadedPage as LoadedPage
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind)
import Unsafe.Coerce (unsafeCoerce)
import Pages.Index as IndexPage
import Pages.People.NameParam as PeopleNameParamPage
import Pages.NotFound as NotFoundPage

type PageMeta =
  { moduleName :: String
  , sourcePath :: String
  , routePattern :: String
  , kind :: PageKind
  , hasSubscriptions :: Boolean
  }

pages :: Array PageMeta
pages =
  [ metaIndex
  , metaPeopleNameParam
  , metaNotFound
  ]

pageForRoute :: Route -> PageMeta
pageForRoute route =
  case route of
    Index -> metaIndex
    PeopleNameParam _ -> metaPeopleNameParam
    NotFound -> metaNotFound

loadPage
  :: forall shared command subscription
   . shared
  -> Request
  -> LoadResult.LoadResult shared Route command subscription
loadPage shared request =
  case request.route of
    Index -> unsafeDecide IndexPage.page IndexPage.protect shared request
    PeopleNameParam _ -> unsafeDecide PeopleNameParamPage.page PeopleNameParamPage.protect shared request
    NotFound -> unsafeDecide NotFoundPage.page NotFoundPage.protect shared request

unsafeDecide
  :: forall model msg shared command subscription pageCommand pageSubscription
   . (Request -> Page.Page model msg shared Route pageCommand pageSubscription)
  -> (shared -> Request -> Maybe Route)
  -> shared
  -> Request
  -> LoadResult.LoadResult shared Route command subscription
unsafeDecide load protect shared request =
  case protect shared request of
    Just redirect ->
      LoadResult.Redirect redirect

    Nothing ->
      LoadResult.Loaded (LoadedPage.fromPage (unsafeCoerce (load request)))

metaIndex :: PageMeta
metaIndex =
  { moduleName: "Pages.Index"
  , sourcePath: "src/Pages/Index.purs"
  , routePattern: "/"
  , kind: IndexPage.kind
  , hasSubscriptions: IndexPage.hasSubscriptions
  }

metaPeopleNameParam :: PageMeta
metaPeopleNameParam =
  { moduleName: "Pages.People.NameParam"
  , sourcePath: "src/Pages/People/NameParam.purs"
  , routePattern: "/people/:name"
  , kind: PeopleNameParamPage.kind
  , hasSubscriptions: PeopleNameParamPage.hasSubscriptions
  }

metaNotFound :: PageMeta
metaNotFound =
  { moduleName: "Pages.NotFound"
  , sourcePath: "src/Pages/NotFound.purs"
  , routePattern: "/not-found"
  , kind: NotFoundPage.kind
  , hasSubscriptions: NotFoundPage.hasSubscriptions
  }
