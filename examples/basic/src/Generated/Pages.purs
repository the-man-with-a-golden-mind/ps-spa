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
import Pages.People.NameParam as PeopleNameParamPage
import Pages.EffectsAndSubscriptions as EffectsAndSubscriptionsPage
import Pages.Index as IndexPage
import Pages.Playground as PlaygroundPage
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
  [ metaPeopleNameParam
  , metaEffectsAndSubscriptions
  , metaIndex
  , metaPlayground
  , metaNotFound
  ]

pageForRoute :: Route -> PageMeta
pageForRoute route =
  case route of
    PeopleNameParam _ -> metaPeopleNameParam
    EffectsAndSubscriptions -> metaEffectsAndSubscriptions
    Index -> metaIndex
    Playground -> metaPlayground
    NotFound -> metaNotFound

loadPage
  :: forall shared command subscription
   . shared
  -> Request
  -> LoadResult.LoadResult shared Route command subscription
loadPage shared request =
  case request.route of
    PeopleNameParam _ -> unsafeDecide PeopleNameParamPage.page PeopleNameParamPage.protect shared request
    EffectsAndSubscriptions -> unsafeDecide EffectsAndSubscriptionsPage.page EffectsAndSubscriptionsPage.protect shared request
    Index -> unsafeDecide IndexPage.page IndexPage.protect shared request
    Playground -> unsafeDecide PlaygroundPage.page PlaygroundPage.protect shared request
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

metaPeopleNameParam :: PageMeta
metaPeopleNameParam =
  { moduleName: "Pages.People.NameParam"
  , sourcePath: "src/Pages/People/NameParam.purs"
  , routePattern: "/people/:name"
  , kind: PeopleNameParamPage.kind
  , hasSubscriptions: PeopleNameParamPage.hasSubscriptions
  }

metaEffectsAndSubscriptions :: PageMeta
metaEffectsAndSubscriptions =
  { moduleName: "Pages.EffectsAndSubscriptions"
  , sourcePath: "src/Pages/EffectsAndSubscriptions.purs"
  , routePattern: "/effects-and-subscriptions"
  , kind: EffectsAndSubscriptionsPage.kind
  , hasSubscriptions: EffectsAndSubscriptionsPage.hasSubscriptions
  }

metaIndex :: PageMeta
metaIndex =
  { moduleName: "Pages.Index"
  , sourcePath: "src/Pages/Index.purs"
  , routePattern: "/"
  , kind: IndexPage.kind
  , hasSubscriptions: IndexPage.hasSubscriptions
  }

metaPlayground :: PageMeta
metaPlayground =
  { moduleName: "Pages.Playground"
  , sourcePath: "src/Pages/Playground.purs"
  , routePattern: "/playground"
  , kind: PlaygroundPage.kind
  , hasSubscriptions: PlaygroundPage.hasSubscriptions
  }

metaNotFound :: PageMeta
metaNotFound =
  { moduleName: "Pages.NotFound"
  , sourcePath: "src/Pages/NotFound.purs"
  , routePattern: "/not-found"
  , kind: NotFoundPage.kind
  , hasSubscriptions: NotFoundPage.hasSubscriptions
  }
