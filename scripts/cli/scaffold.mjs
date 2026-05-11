import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(cliDir, "..", "..");
const assetDir = path.join(cliDir, "scaffold-assets");

const exampleDependencies = [
  "arrays",
  "effect",
  "foldable-traversable",
  "integers",
  "maybe",
  "prelude",
  "psci-support",
  "refs",
  "strings"
];

function packageJsonSource(root, packageRoot = repoRoot) {
  const fromAppToPackage = relativePathFromAppToPackage(root, packageRoot);

  return `${JSON.stringify(
    {
      name: appNameFromRoot(root),
      private: true,
      type: "module",
      scripts: {
        build: `node ${fromAppToPackage}/scripts/app-build.mjs --root .`,
        dev: `node ${fromAppToPackage}/scripts/app-dev.mjs --root .`,
        preview: "vite preview"
      },
      devDependencies: {
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

function mainModuleSource() {
  return `module Main where

import Prelude

import Effect (Effect)
import Generated.App as App

main :: Effect Unit
main = App.start
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

function spagoSource(root, packageRoot = repoRoot) {
  const fromAppToPackage = relativePathFromAppToPackage(root, packageRoot);

  return `{ name = "${appNameFromRoot(root)}"
, dependencies = [ ${exampleDependencies.map((dependency) => `"${dependency}"`).join(", ")} ]
, packages = ${fromAppToPackage}/packages.dhall
, sources = [ "src/**/*.purs", "${fromAppToPackage}/src/**/*.purs" ]
}
`;
}

function readAsset(fileName) {
  return fs.readFileSync(path.join(assetDir, fileName), "utf8");
}

export function collectAppScaffoldFiles(root, packageRoot = repoRoot) {
  return [
    {
      content: spagoSource(root, packageRoot),
      relativePath: "spago.dhall"
    },
    {
      content: mainModuleSource(),
      relativePath: path.join("src", "Main.purs")
    },
    {
      content: packageJsonSource(root, packageRoot),
      relativePath: "package.json"
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
