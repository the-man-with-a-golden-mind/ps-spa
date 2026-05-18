import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(cliDir, "..", "..");
const assetDir = path.join(cliDir, "scaffold-assets");
const packageManifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));

const exampleDependencies = [
  "arrays",
  "const",
  "effect",
  "foldable-traversable",
  "integers",
  "maybe",
  "prelude",
  "psci-support",
  "refs",
  "strings",
  "unsafe-coerce"
];

function packageJsonSource(root, packageRoot = repoRoot) {
  const packageDependency = packageDependencySource(root, packageRoot);

  return `${JSON.stringify(
    {
      name: appNameFromRoot(root),
      private: true,
      type: "module",
      scripts: {
        build: "vite build",
        dev: "vite",
        preview: "vite preview"
      },
      dependencies: {
        "ps-spa": packageDependency
      },
      devDependencies: {
        esbuild: "^0.24.0",
        spago: "^1.0.4",
        vite: "^5.4.19"
      }
    },
    null,
    2
  )}\n`;
}

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function appNameFromRoot(root) {
  const leaf = path.basename(root).replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return leaf.length > 0 ? `ps-spa-${leaf.toLowerCase()}` : "ps-spa-app";
}

function relativePathFromAppToPackage(root, packageRoot = repoRoot) {
  const relative = path.relative(root, packageRoot);
  return normalizePath(relative.length > 0 ? relative : ".");
}

function importPathFromAppToPackage(root, packageRoot = repoRoot) {
  const relative = relativePathFromAppToPackage(root, packageRoot);
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function packageDependencySource(root, packageRoot = repoRoot) {
  if (packageRoot === repoRoot) {
    return `file:${importPathFromAppToPackage(root, packageRoot)}`;
  }

  return `^${packageManifest.version}`;
}

function mainModuleSource() {
  return `module Main where

import Prelude

import Data.Const (Const(..))
import Effect (Effect)
import Generated.App as App
import Shared as Shared

main :: Effect Unit
main =
  App.startWith
    { initialShared: Shared.init
    , onCommand: absurd
    , onSubscription: \\_ (Const impossible) -> absurd impossible
    , rootId: "app"
    , sharedSubscriptions: \\_ _ -> []
    }
`;
}

function sharedModuleSource() {
  return `module Shared
  ( Shared
  , init
  ) where

import Data.Maybe (Maybe(..))
import Auth (User)

-- | App-wide state visible to every page and protect guard. The runtime hands
-- | this record to pages as the polymorphic \`shared\` parameter; advanced
-- | pages can emit a new value via \`Effect.fromShared\` to trigger a re-render
-- | with fresh shared state.
-- |
-- | Extend this record with whatever your app needs (theme, feature flags,
-- | session token, …). Pages that need a field just constrain their protect
-- | / view signatures to the relevant row.
type Shared =
  { currentUser :: Maybe User
  }

-- | Initial Shared value handed to \`App.startWith { initialShared: Shared.init,
-- | … }\`. Replace \`currentUser: Nothing\` with whatever you read out of
-- | localStorage / cookies / SSR payload at boot.
init :: Shared
init =
  { currentUser: Nothing
  }
`;
}

function authModuleSource() {
  return `module Auth
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

-- | Reusable protect guard: returns \`Just loginRoute\` when shared state has
-- | no current user. Wire into a page's \`protect\`:
-- |
-- |     import Auth as Auth
-- |     import Generated.Route (Route(..))
-- |
-- |     protect = Auth.requireUser Login
-- |
-- | The signature is row-polymorphic in \`shared\`, so adding fields to Shared
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
`;
}

function indexHtmlSource(appName) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${appName}</title>
    <link rel="stylesheet" href="./styles/tailwind.css" onerror="this.remove()" />
  </head>
  <body>
    <div id="app"></div>
    <script src="/app.js"></script>
  </body>
</html>
`;
}

function viteConfigSource(root, packageRoot = repoRoot) {
  return `import { defineConfig } from "vite";
import { psSpaVite } from "ps-spa/scripts/vite-plugin.mjs";

export default defineConfig({
  plugins: [psSpaVite()]
});
`;
}

function spagoSource(root, packageRoot = repoRoot) {
  const deps = [...exampleDependencies, "ps-spa"]
    .map((dependency) => `    - ${dependency}`)
    .join("\n");

  return `workspace:
  packageSet:
    registry: 41.2.0
  extraPackages:
    ps-spa:
      path: node_modules/ps-spa

package:
  name: ${appNameFromRoot(root)}
  dependencies:
${deps}
`;
}

function readAsset(fileName) {
  return fs.readFileSync(path.join(assetDir, fileName), "utf8");
}

export function collectAppScaffoldFiles(root, packageRoot = repoRoot) {
  return [
    {
      content: spagoSource(root, packageRoot),
      relativePath: "spago.yaml"
    },
    {
      content: mainModuleSource(),
      relativePath: path.join("src", "Main.purs")
    },
    {
      content: sharedModuleSource(),
      relativePath: path.join("src", "Shared.purs")
    },
    {
      content: authModuleSource(),
      relativePath: path.join("src", "Auth.purs")
    },
    {
      content: packageJsonSource(root, packageRoot),
      relativePath: "package.json"
    },
    {
      content: viteConfigSource(root, packageRoot),
      relativePath: "vite.config.mjs"
    },
    {
      content: indexHtmlSource(appNameFromRoot(root)),
      relativePath: "index.html"
    },
    {
      content: readAsset("bench-index.html"),
      relativePath: path.join("public", "bench", "index.html")
    },
    {
      content: readAsset("bench-client.js"),
      relativePath: path.join("public", "bench", "client.js")
    }
  ];
}
