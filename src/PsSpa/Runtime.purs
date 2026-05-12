module PsSpa.Runtime
  ( AppConfig
  , start
  ) where

import Prelude

import Data.Foldable (all, traverse_)
import Data.Traversable (traverse)
import Effect (Effect)
import Effect.Ref as Ref
import PsSpa.Browser as Browser
import PsSpa.Effect as PageEffect
import PsSpa.LoadResult as LoadResult
import PsSpa.LoadedPage as LoadedPage
import PsSpa.Page as Page
import PsSpa.View as View

type AppConfig shared route request command subscription =
  { initialShared :: shared
  , loadPage :: shared -> request -> LoadResult.LoadResult shared route command subscription
  , onCommand :: command -> Effect Unit
  , onSubscription :: forall msg. (msg -> Effect Unit) -> subscription msg -> Effect Browser.Cleanup
  , parseRequest :: String -> request
  , rootId :: String
  , sharedSubscriptions :: request -> shared -> Array (subscription Void)
  , toPath :: route -> String
  }

start
  :: forall shared route request command subscription
   . AppConfig shared route request command subscription
  -> Effect Unit
start config = do
  sharedRef <- Ref.new config.initialShared
  pageCleanupRef <- Ref.new (pure unit)
  sharedCleanupRef <- Ref.new (pure unit)

  let
    cleanupPage = do
      cleanup <- Ref.read pageCleanupRef
      cleanup

    cleanupShared = do
      cleanup <- Ref.read sharedCleanupRef
      cleanup

    runCommands commands =
      traverse_ config.onCommand commands

    installSubscriptions
      :: forall msg
       . (msg -> Effect Unit)
      -> Array (subscription msg)
      -> Effect Browser.Cleanup
    installSubscriptions handle subscriptions = do
      cleanups <- traverse (config.onSubscription handle) subscriptions
      pure (traverse_ identity cleanups)

    installSharedSubscriptions
      :: Array (subscription Void)
      -> Effect Browser.Cleanup
    installSharedSubscriptions subscriptions =
      installSubscriptions absurd subscriptions

    goWith pushOrReplace route = do
      pushOrReplace (config.toPath route)
      openRequest (config.parseRequest (config.toPath route))

    openCurrentPath = do
      href <- Browser.currentPath
      openRequest (config.parseRequest href)

    renderLoaded request loaded =
      LoadedPage.withPage
        (\page ->
          case page of
            Page.StaticPage pageConfig -> do
              Browser.renderDocument
                { rootId: config.rootId
                , document: View.map (const (pure unit)) pageConfig.view
                }
              pure (pure unit)

            Page.SandboxPage pageConfig -> do
              modelRef <- Ref.new pageConfig.init

              let
                render = do
                  model <- Ref.read modelRef
                  Browser.renderDocument
                    { rootId: config.rootId
                    , document: View.map handle (pageConfig.view model)
                    }

                handle msg = do
                  model <- Ref.read modelRef
                  Ref.write (pageConfig.update msg model) modelRef
                  render

              render
              pure (pure unit)

            Page.ElementPage pageConfig -> do
              modelRef <- Ref.new pageConfig.init.model
              subCleanupRef <- Ref.new (pure unit)

              let
                render = do
                  previous <- Ref.read subCleanupRef
                  previous
                  model <- Ref.read modelRef
                  cleanup <- installSubscriptions handle (pageConfig.subscriptions model)
                  Ref.write cleanup subCleanupRef
                  Browser.renderDocument
                    { rootId: config.rootId
                    , document: View.map handle (pageConfig.view model)
                    }

                handle msg = do
                  model <- Ref.read modelRef
                  let step = pageConfig.update msg model
                  Ref.write step.model modelRef
                  runCommands step.effect
                  render

              runCommands pageConfig.init.effect
              render
              pure do
                cleanup <- Ref.read subCleanupRef
                cleanup

            Page.AdvancedPage pageConfig -> do
              modelRef <- Ref.new pageConfig.init.model
              subCleanupRef <- Ref.new (pure unit)

              let
                render = do
                  previous <- Ref.read subCleanupRef
                  previous
                  model <- Ref.read modelRef
                  cleanup <- installSubscriptions handle (pageConfig.subscriptions model)
                  Ref.write cleanup subCleanupRef
                  Browser.renderDocument
                    { rootId: config.rootId
                    , document: View.map handle (pageConfig.view model)
                    }

                handle msg = do
                  model <- Ref.read modelRef
                  let step = pageConfig.update msg model
                  Ref.write step.model modelRef
                  keepCurrentPage <- interpretEffect step.effect
                  when keepCurrentPage render

                interpretEffect effect =
                  case effect of
                    PageEffect.None ->
                      pure true

                    PageEffect.Batch effects ->
                      do
                        traverse_ interpretEffect effects
                        pure (keepsCurrentPage effect)

                    PageEffect.FromCommand command ->
                      config.onCommand command *> pure true

                    PageEffect.FromShared shared ->
                      Ref.write shared sharedRef *> openRequest request *> pure false

                    PageEffect.Push nextRoute ->
                      goWith Browser.pushUrl nextRoute *> pure false

                    PageEffect.Replace nextRoute ->
                      goWith Browser.replaceUrl nextRoute *> pure false

                keepsCurrentPage activeEffect =
                  case activeEffect of
                    PageEffect.None ->
                      true

                    PageEffect.Batch effects ->
                      all keepsCurrentPage effects

                    PageEffect.FromCommand _ ->
                      true

                    PageEffect.FromShared _ ->
                      false

                    PageEffect.Push _ ->
                      false

                    PageEffect.Replace _ ->
                      false

              _ <- interpretEffect pageConfig.init.effect
              render
              pure do
                cleanup <- Ref.read subCleanupRef
                cleanup
        )
        loaded

    openRequest request = do
      cleanupPage
      cleanupShared
      shared <- Ref.read sharedRef
      case config.loadPage shared request of
        LoadResult.Redirect route -> do
          Browser.replaceUrl (config.toPath route)
          openRequest (config.parseRequest (config.toPath route))

        LoadResult.Loaded loaded -> do
          cleanup <- renderLoaded request loaded
          Ref.write cleanup pageCleanupRef
          latestShared <- Ref.read sharedRef
          sharedCleanup <- installSharedSubscriptions (config.sharedSubscriptions request latestShared)
          Ref.write sharedCleanup sharedCleanupRef

  _ <- Browser.onPopState openCurrentPath
  _ <- Browser.onInternalUrlRequest \href -> do
    Browser.pushUrl href
    openRequest (config.parseRequest href)
  openCurrentPath
