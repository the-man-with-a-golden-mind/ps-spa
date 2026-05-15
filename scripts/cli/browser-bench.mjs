import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliDir = path.dirname(fileURLToPath(import.meta.url));
const browserSourceFile = path.join(cliDir, "..", "..", "src", "PsSpa", "Browser.js");

export function browserBenchmarkManifestFile() {
  return path.join("public", "bench", "routes.generated.json");
}

export function browserBenchmarkRuntimeFile() {
  return path.join("public", "bench", "browser-runtime.generated.js");
}

export function generateBrowserBenchmarkManifest(routes) {
  return `${JSON.stringify(
    {
      routes: routes.map((route) => ({
        constructor: route.constructor,
        dynamicParams: route.dynamicParams,
        isNotFound: route.isNotFound,
        path: route.path,
        routePattern: route.routePattern
      }))
    },
    null,
    2
  )}\n`;
}

export function generateBrowserRuntimeModule() {
  // Browser.js is already an ES module — copy it through verbatim.
  return fs.readFileSync(browserSourceFile, "utf8");
}

export function collectBrowserBenchmarkArtifacts(_root, routes) {
  return [
    {
      content: generateBrowserBenchmarkManifest(routes),
      relativePath: browserBenchmarkManifestFile()
    },
    {
      content: generateBrowserRuntimeModule(),
      relativePath: browserBenchmarkRuntimeFile()
    }
  ];
}

export function syncBrowserBenchmarkArtifacts(root, routes) {
  const files = [];

  for (const artifact of collectBrowserBenchmarkArtifacts(root, routes)) {
    const absolutePath = path.join(root, artifact.relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, artifact.content);
    files.push(artifact.relativePath);
  }

  return files;
}
