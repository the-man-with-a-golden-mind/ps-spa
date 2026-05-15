import fs from "node:fs";
import path from "node:path";

import { collectBrowserBenchmarkArtifacts } from "./browser-bench.mjs";
import { generateAppModule, generateLinkModule, generatePagesModule, generateRouteModule } from "./codegen.mjs";
import { collectQualityArtifacts } from "./quality.mjs";
import { scanPages } from "./routes.mjs";
import {
  tailwindObsoleteFiles,
  tailwindPackageJsonPatch,
  tailwindScaffoldFiles
} from "./tailwind.mjs";
import { extractSpagoPublishVersion } from "./version.mjs";

function readUtf8IfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
}

function compareTextArtifact(root, relativePath, expectedContent) {
  const absolutePath = path.join(root, relativePath);
  const current = readUtf8IfExists(absolutePath);

  if (current === null) {
    return {
      relativePath,
      status: "missing"
    };
  }

  if (current !== expectedContent) {
    return {
      relativePath,
      status: "drift"
    };
  }

  return {
    relativePath,
    status: "ok"
  };
}

function walkFiles(root, relativeDir, suffix) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];

  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith(suffix)) {
        files.push(path.relative(root, absolutePath));
      }
    }
  }

  walk(absoluteDir);
  files.sort();
  return files;
}

function compareArtifactDirectory(root, relativeDir, suffix, expectedRelativePaths) {
  const actualFiles = walkFiles(root, relativeDir, suffix);
  const expectedSet = new Set(expectedRelativePaths);

  return actualFiles
    .filter((relativePath) => !expectedSet.has(relativePath))
    .map((relativePath) => ({
      relativePath,
      status: "extra"
    }));
}

function hasTailwindPages(root, routes) {
  return routes.some((route) => {
    const filePath = path.join(root, route.pageFile);
    return readUtf8IfExists(filePath)?.includes("kind = Tailwind") ?? false;
  });
}

function collectTailwindObsoleteChecks(root) {
  return tailwindObsoleteFiles
    .filter((relativePath) => fs.existsSync(path.join(root, relativePath)))
    .map((relativePath) => ({ relativePath, status: "extra" }));
}

function collectTailwindChecks(root, required) {
  if (!required) {
    return collectTailwindObsoleteChecks(root);
  }

  const checks = tailwindScaffoldFiles.map((file) =>
    compareTextArtifact(root, file.path, file.content)
  );

  const viteConfig = readUtf8IfExists(path.join(root, "vite.config.mjs"));
  if (viteConfig === null) {
    checks.push({ relativePath: "vite.config.mjs", status: "missing" });
  } else if (!viteConfig.includes("@tailwindcss/vite")) {
    checks.push({ relativePath: "vite.config.mjs#@tailwindcss/vite", status: "missing" });
  }

  const packageJsonPath = path.join(root, "package.json");
  const packageJson = readUtf8IfExists(packageJsonPath);

  if (packageJson === null) {
    checks.push({ relativePath: "package.json", status: "missing" });
    return [...checks, ...collectTailwindObsoleteChecks(root)];
  }

  const parsed = JSON.parse(packageJson);

  for (const [name, value] of Object.entries(tailwindPackageJsonPatch.scripts ?? {})) {
    checks.push({
      relativePath: `package.json#scripts.${name}`,
      status: parsed.scripts?.[name] === value ? "ok" : "missing"
    });
  }

  for (const [name, value] of Object.entries(tailwindPackageJsonPatch.devDependencies)) {
    checks.push({
      relativePath: `package.json#devDependencies.${name}`,
      status: parsed.devDependencies?.[name] === value ? "ok" : "missing"
    });
  }

  return [...checks, ...collectTailwindObsoleteChecks(root)];
}

function collectGeneratedChecks(root, routes) {
  const routeModule = generateRouteModule(routes);
  const pagesModule = generatePagesModule(routes);
  const qualityArtifacts = collectQualityArtifacts(routes);
  const browserArtifacts = collectBrowserBenchmarkArtifacts(root, routes);
  const expectedTests = qualityArtifacts.tests.map((artifact) => artifact.relativePath);
  const expectedBenchmarks = qualityArtifacts.benchmarks.map((artifact) => artifact.relativePath);

  return [
    compareTextArtifact(root, path.join("src", "Generated", "App.purs"), generateAppModule()),
    compareTextArtifact(root, path.join("src", "Generated", "Link.purs"), generateLinkModule()),
    compareTextArtifact(root, path.join("src", "Generated", "Route.purs"), routeModule),
    compareTextArtifact(root, path.join("src", "Generated", "Pages.purs"), pagesModule),
    ...qualityArtifacts.tests.map((artifact) =>
      compareTextArtifact(root, artifact.relativePath, artifact.content)
    ),
    ...qualityArtifacts.benchmarks.map((artifact) =>
      compareTextArtifact(root, artifact.relativePath, artifact.content)
    ),
    ...browserArtifacts.map((artifact) =>
      compareTextArtifact(root, artifact.relativePath, artifact.content)
    ),
    ...compareArtifactDirectory(root, "tests-generated", ".test.mjs", expectedTests),
    ...compareArtifactDirectory(root, "benchmarks-generated", ".bench.mjs", expectedBenchmarks)
  ];
}

function summarize(checks) {
  return checks.reduce(
    (accumulator, check) => {
      accumulator[check.status] = (accumulator[check.status] ?? 0) + 1;
      return accumulator;
    },
    { drift: 0, extra: 0, missing: 0, ok: 0 }
  );
}

function collectVersionChecks(root) {
  const packageJson = readUtf8IfExists(path.join(root, "package.json"));
  const spagoYaml = readUtf8IfExists(path.join(root, "spago.yaml"));

  if (packageJson === null || spagoYaml === null) return [];

  const spagoVersion = extractSpagoPublishVersion(spagoYaml);
  if (spagoVersion === null) return [];

  const pkgVersion = JSON.parse(packageJson).version;
  if (typeof pkgVersion !== "string") return [];

  if (pkgVersion === spagoVersion) {
    return [{ relativePath: "version (package.json <-> spago.yaml)", status: "ok" }];
  }

  return [
    {
      relativePath: `version drift: package.json=${pkgVersion} spago.yaml=${spagoVersion}`,
      status: "drift"
    }
  ];
}

export function verifyProject(root) {
  const routes = scanPages(root);
  const tailwindRequired = hasTailwindPages(root, routes);
  const generatedChecks = collectGeneratedChecks(root, routes);
  const tailwindChecks = collectTailwindChecks(root, tailwindRequired);
  const versionChecks = collectVersionChecks(root);
  const checks = [...generatedChecks, ...tailwindChecks, ...versionChecks];
  const issues = checks
    .filter((check) => check.status !== "ok")
    .map((check) => `${check.status.toUpperCase()}: ${check.relativePath}`);

  return {
    checks,
    issues,
    ok: issues.length === 0,
    routes,
    summary: summarize(checks),
    tailwindRequired
  };
}

export function doctorProject(root) {
  const verification = verifyProject(root);
  const dynamicRouteCount = verification.routes.filter((route) => route.dynamicParams.length > 0).length;
  const notFoundCount = verification.routes.filter((route) => route.isNotFound).length;
  const staticRouteCount = verification.routes.length - dynamicRouteCount - notFoundCount;

  return {
    ...verification,
    project: {
      dynamicRouteCount,
      pageCount: verification.routes.length,
      staticRouteCount,
      tailwindPageCount: verification.tailwindRequired
        ? verification.routes.filter((route) =>
            readUtf8IfExists(path.join(root, route.pageFile))?.includes("kind = Tailwind")
          ).length
        : 0
    }
  };
}
