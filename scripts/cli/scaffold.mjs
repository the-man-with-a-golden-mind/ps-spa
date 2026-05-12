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
      packageManager: "bun@1.3.9",
      scripts: {
        build: "bunx --bun vite build",
        dev: "bunx --bun vite",
        preview: "bunx --bun vite preview"
      },
      dependencies: {
        "ps-spa": packageDependency
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

function viteConfigSource(root, packageRoot = repoRoot) {
  return `import { defineConfig } from "vite";
import { psSpaVite } from "ps-spa/scripts/vite-plugin.mjs";

export default defineConfig({
  plugins: [psSpaVite()]
});
`;
}

function spagoSource(root, packageRoot = repoRoot) {
  return `{ name = "${appNameFromRoot(root)}"
, dependencies = [ ${exampleDependencies.map((dependency) => `"${dependency}"`).join(", ")} ]
, packages = ./node_modules/ps-spa/packages.dhall
, sources = [ "src/**/*.purs", "node_modules/ps-spa/src/**/*.purs" ]
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
