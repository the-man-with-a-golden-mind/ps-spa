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
import Pages.Marketing.Hero as MarketingHeroPage
import Pages.Guides.SlugParam as GuidesSlugParamPage
import Pages.Index as IndexPage
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
  [ metaMarketingHero
  , metaGuidesSlugParam
  , metaIndex
  , metaNotFound
  ]

pageForRoute :: Route -> PageMeta
pageForRoute route =
  case route of
    MarketingHero -> metaMarketingHero
    GuidesSlugParam _ -> metaGuidesSlugParam
    Index -> metaIndex
    NotFound -> metaNotFound

loadPage
  :: forall shared command subscription
   . shared
  -> Request
  -> LoadResult.LoadResult shared Route command subscription
loadPage shared request =
  case request.route of
    MarketingHero -> decide MarketingHeroPage.page MarketingHeroPage.protect shared request
    GuidesSlugParam _ -> decide GuidesSlugParamPage.page GuidesSlugParamPage.protect shared request
    Index -> decide IndexPage.page IndexPage.protect shared request
    NotFound -> decide NotFoundPage.page NotFoundPage.protect shared request

decide
  :: forall model msg shared command subscription
   . (Request -> Page.Page model msg shared Route command subscription)
  -> (shared -> Request -> Maybe Route)
  -> shared
  -> Request
  -> LoadResult.LoadResult shared Route command subscription
decide load protect shared request =
  case protect shared request of
    Just redirect ->
      LoadResult.Redirect redirect

    Nothing ->
      LoadResult.Loaded (LoadedPage.fromPage (load request))

metaMarketingHero :: PageMeta
metaMarketingHero =
  { moduleName: "Pages.Marketing.Hero"
  , sourcePath: "src/Pages/Marketing/Hero.purs"
  , routePattern: "/marketing/hero"
  , kind: MarketingHeroPage.kind
  , hasSubscriptions: MarketingHeroPage.hasSubscriptions
  }

metaGuidesSlugParam :: PageMeta
metaGuidesSlugParam =
  { moduleName: "Pages.Guides.SlugParam"
  , sourcePath: "src/Pages/Guides/SlugParam.purs"
  , routePattern: "/guides/:slug"
  , kind: GuidesSlugParamPage.kind
  , hasSubscriptions: GuidesSlugParamPage.hasSubscriptions
  }

metaIndex :: PageMeta
metaIndex =
  { moduleName: "Pages.Index"
  , sourcePath: "src/Pages/Index.purs"
  , routePattern: "/"
  , kind: IndexPage.kind
  , hasSubscriptions: IndexPage.hasSubscriptions
  }

metaNotFound :: PageMeta
metaNotFound =
  { moduleName: "Pages.NotFound"
  , sourcePath: "src/Pages/NotFound.purs"
  , routePattern: "/not-found"
  , kind: NotFoundPage.kind
  , hasSubscriptions: NotFoundPage.hasSubscriptions
  }
