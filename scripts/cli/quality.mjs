import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliDir = path.dirname(fileURLToPath(import.meta.url));
const runtimeHarnessSourceFile = path.join(cliDir, "..", "..", "benchmarks", "runtime-harness.mjs");

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeRouteName(routeInfo) {
  return routeInfo.constructor;
}

export function routeTestFile(routeInfo) {
  return path.join("tests-generated", `${normalizeRouteName(routeInfo)}.test.mjs`);
}

export function routeBenchmarkFile(routeInfo) {
  return path.join("benchmarks-generated", `${normalizeRouteName(routeInfo)}.bench.mjs`);
}

export function benchmarkHarnessFile() {
  return path.join("benchmarks-generated", "_runtime-harness.mjs");
}

export function collectQualityArtifacts(routes) {
  return {
    benchmarks: routes.map((route) => ({
      content: generatePageBenchmark(route),
      relativePath: routeBenchmarkFile(route)
    })),
    benchmarkSupport: [
      {
        content: fs.readFileSync(runtimeHarnessSourceFile, "utf8"),
        relativePath: benchmarkHarnessFile()
      }
    ],
    tests: routes.map((route) => ({
      content: generatePageSmokeTest(route),
      relativePath: routeTestFile(route)
    }))
  };
}

export function generatePageSmokeTest(routeInfo) {
  const routeChecks = [
    routeInfo.constructor,
    ...(routeInfo.isNotFound
      ? ["/not-found"]
      : routeInfo.dynamicParams.length === 0
        ? [routeInfo.routePattern ?? routeInfo.path ?? "/"]
        : routeInfo.routePattern
            .split("/")
            .filter(Boolean)
            .filter((segment) => !segment.startsWith(":")))
  ];

  return `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pageFile = path.join(root, "${routeInfo.pageFile.split(path.sep).join("/")}");
const generatedRouteFile = path.join(root, "src", "Generated", "Route.purs");
const generatedPagesFile = path.join(root, "src", "Generated", "Pages.purs");

test("${routeInfo.constructor} page file exists", () => {
  assert.ok(fs.existsSync(pageFile));
});

test("${routeInfo.constructor} route is registered", () => {
  const routeSource = fs.readFileSync(generatedRouteFile, "utf8");
${routeChecks
  .map(
    (check) =>
      `  assert.match(routeSource, new RegExp(${JSON.stringify(escapeForRegex(check))}));`
  )
  .join("\n")}
});

test("${routeInfo.constructor} page loader is registered", () => {
  const pagesSource = fs.readFileSync(generatedPagesFile, "utf8");
  assert.match(pagesSource, new RegExp(${JSON.stringify(escapeForRegex(routeInfo.moduleName))}));
  assert.match(pagesSource, new RegExp(${JSON.stringify(escapeForRegex(routeInfo.constructor))}));
});
`;
}

export function generatePageBenchmark(routeInfo) {
  const title = routeInfo.constructor;

  return `import {
  buildPageDocument,
  runNavigationBenchmark,
  runRenderBenchmark,
  runRerenderBenchmark
} from "./_runtime-harness.mjs";

export function scenarios() {
  return [
    runRenderBenchmark("${routeInfo.constructor}:render", 250, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "${routeInfo.path ?? "/not-found"}",
        sections: 3,
        title: "${title}"
      })
    ),
    runRerenderBenchmark("${routeInfo.constructor}:rerender", 150, () =>
      buildPageDocument({
        buttonsPerCard: 2,
        cardsPerSection: 6,
        links: 6,
        route: "${routeInfo.path ?? "/not-found"}",
        sections: 3,
        title: "${title}"
      })
    ),
    runNavigationBenchmark("${routeInfo.constructor}:nav", 20000, "${routeInfo.path ?? "/not-found"}")
  ];
}
`;
}

function escapeForRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function syncQualityArtifacts(root, routes) {
  const generatedTests = [];
  const generatedBenchmarks = [];
  const artifacts = collectQualityArtifacts(routes);
  const expectedTestPaths = new Set(artifacts.tests.map((artifact) => artifact.relativePath));
  const expectedBenchmarkPaths = new Set(
    [...artifacts.benchmarks, ...artifacts.benchmarkSupport].map((artifact) => artifact.relativePath)
  );

  for (const artifact of artifacts.tests) {
    const testFile = path.join(root, artifact.relativePath);
    ensureDir(testFile);
    fs.writeFileSync(testFile, artifact.content);
    generatedTests.push(path.relative(root, testFile));
  }

  for (const artifact of [...artifacts.benchmarks, ...artifacts.benchmarkSupport]) {
    const benchmarkFile = path.join(root, artifact.relativePath);
    ensureDir(benchmarkFile);
    fs.writeFileSync(benchmarkFile, artifact.content);
    if (artifact.relativePath.endsWith(".bench.mjs")) {
      generatedBenchmarks.push(path.relative(root, benchmarkFile));
    }
  }

  cleanupStaleArtifacts(path.join(root, "tests-generated"), ".mjs", expectedTestPaths, root);
  cleanupStaleArtifacts(path.join(root, "benchmarks-generated"), ".mjs", expectedBenchmarkPaths, root);

  return {
    generatedBenchmarks,
    generatedTests
  };
}

function cleanupStaleArtifacts(rootDir, suffix, expectedPaths, root) {
  if (!fs.existsSync(rootDir)) return;

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const absolutePath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      cleanupStaleArtifacts(absolutePath, suffix, expectedPaths, root);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(suffix)) continue;

    const relativePath = path.relative(root, absolutePath);
    if (!expectedPaths.has(relativePath)) {
      fs.rmSync(absolutePath);
    }
  }
}
