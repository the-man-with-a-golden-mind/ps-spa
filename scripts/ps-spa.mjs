#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { doctorProject, verifyProject } from "./cli/doctor.mjs";
import { addPage, createApp, generateFiles } from "./cli/project.mjs";
import { runBenchmarkSuite } from "./cli/benchmarks.mjs";
import { browserBenchmarkManifestFile, browserBenchmarkRuntimeFile } from "./cli/browser-bench.mjs";
import { generateAppModule, generateLinkModule, generatePagesModule, generateRouteModule } from "./cli/codegen.mjs";
import { compareRoutes, pageFileToRouteInfo, routeToPageFile, scanPages, titleFromRoute } from "./cli/routes.mjs";
import { ensureTailwindScaffold } from "./cli/tailwind.mjs";
import { generatePageTemplate } from "./cli/templates.mjs";
import { pascalToKebab } from "./cli/naming.mjs";
import { bumpVersion, readCurrentVersion } from "./cli/version.mjs";

const frameworkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export {
  addPage,
  browserBenchmarkManifestFile,
  browserBenchmarkRuntimeFile,
  bumpVersion,
  compareRoutes,
  createApp,
  doctorProject,
  ensureTailwindScaffold,
  generateAppModule,
  generateLinkModule,
  generateFiles,
  generatePageTemplate,
  generatePagesModule,
  generateRouteModule,
  pageFileToRouteInfo,
  pascalToKebab,
  readCurrentVersion,
  routeToPageFile,
  runBenchmarkSuite,
  scanPages,
  titleFromRoute,
  verifyProject
};

function printUsage() {
  console.log(`ps-spa

Usage:
  node scripts/ps-spa.mjs new <dir>
  node scripts/ps-spa.mjs [--root <dir>] add <route> [static|sandbox|element|advanced|tailwind]
  node scripts/ps-spa.mjs [--root <dir>] gen
  node scripts/ps-spa.mjs [--root <dir>] verify
  node scripts/ps-spa.mjs [--root <dir>] doctor
  node scripts/ps-spa.mjs version
  node scripts/ps-spa.mjs bump-version <semver|patch|minor|major> [--commit] [--tag]
  node scripts/run-browser-bench.mjs [--root <dir>] [--verify] [--open] [--port 4173]

Note: \`version\` and \`bump-version\` always target the ps-spa framework
package.json + spago.yaml, regardless of --root.
`);
}

function parseCliArgs(argv) {
  let root = process.cwd();
  const remaining = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--root") {
      root = path.resolve(process.cwd(), argv[index + 1] ?? ".");
      index += 1;
      continue;
    }

    remaining.push(argument);
  }

  return { remaining, root };
}

async function main(argv) {
  const { remaining, root } = parseCliArgs(argv);
  const [command, firstArg, secondArg] = remaining;

  if (!command) {
    printUsage();
    return;
  }

  if (command === "new") {
    if (!firstArg) {
      throw new Error("Missing target directory. Example: node scripts/ps-spa.mjs new examples/my-app");
    }

    const targetRoot = path.resolve(process.cwd(), firstArg);
    const result = createApp(targetRoot);
    console.log(`Created app scaffold in ${path.relative(process.cwd(), targetRoot) || "."}`);
    console.log(`Created ${result.createdFiles.length} scaffold file(s)`);
    console.log(
      `Generated ${result.generated.generatedAppFile}, ${result.generated.generatedLinkFile}, ${result.generated.generatedRouteFile}, and ${result.generated.generatedPagesFile}`
    );
    console.log(`Generated ${result.generated.generatedTests.length} smoke test file(s)`);
    console.log(`Generated ${result.generated.generatedBenchmarks.length} benchmark file(s)`);
    console.log(`Generated ${result.generated.generatedBrowserBenchmarkFiles.length} browser benchmark asset(s)`);
    return;
  }

  if (command === "add") {
    if (!firstArg) {
      throw new Error("Missing route. Example: node scripts/ps-spa.mjs add /users/:name advanced");
    }

    const result = addPage(root, firstArg, secondArg ?? "static");
    console.log(`Created ${result.created}`);
    console.log(
      `Generated ${result.generated.generatedAppFile}, ${result.generated.generatedLinkFile}, ${result.generated.generatedRouteFile}, and ${result.generated.generatedPagesFile}`
    );
    console.log(`Generated ${result.generated.generatedTests.length} smoke test file(s)`);
    console.log(`Generated ${result.generated.generatedBenchmarks.length} benchmark file(s)`);
    console.log(`Generated ${result.generated.generatedBrowserBenchmarkFiles.length} browser benchmark asset(s)`);
    return;
  }

  if (command === "gen") {
    const result = generateFiles(root);
    console.log(
      `Generated ${result.generatedAppFile}, ${result.generatedLinkFile}, ${result.generatedRouteFile}, and ${result.generatedPagesFile} from ${result.routes.length} page file(s)`
    );
    console.log(`Synced ${result.generatedTests.length} smoke test file(s)`);
    console.log(`Synced ${result.generatedBenchmarks.length} benchmark file(s)`);
    console.log(`Synced ${result.generatedBrowserBenchmarkFiles.length} browser benchmark asset(s)`);
    return;
  }

  if (command === "verify") {
    const result = verifyProject(root);
    if (!result.ok) {
      throw new Error(`Verification failed\n${result.issues.map((issue) => `- ${issue}`).join("\n")}`);
    }

    console.log(`Verified ${result.routes.length} page file(s); generated artifacts are in sync`);
    return;
  }

  if (command === "version") {
    console.log(readCurrentVersion(frameworkRoot));
    return;
  }

  if (command === "bump-version") {
    if (!firstArg) {
      throw new Error(
        "Missing version. Example: node scripts/ps-spa.mjs bump-version 0.2.0 (or patch|minor|major)"
      );
    }

    const tag = remaining.includes("--tag");
    const commit = tag || remaining.includes("--commit");

    const result = bumpVersion(frameworkRoot, firstArg, { commit, tag });
    if (!result.changed) {
      console.log(`Version is already ${result.currentVersion}; nothing to do.`);
      return;
    }

    console.log(`Bumped ps-spa framework: ${result.currentVersion} -> ${result.nextVersion}`);
    for (const file of result.files) {
      console.log(`  updated ${file}`);
    }
    if (result.committed) {
      console.log(`  committed v${result.nextVersion}`);
    }
    if (result.tagged) {
      console.log(`  tagged v${result.nextVersion}`);
    }
    return;
  }

  if (command === "doctor") {
    const result = doctorProject(root);
    console.log(`pages: ${result.project.pageCount}`);
    console.log(`static routes: ${result.project.staticRouteCount}`);
    console.log(`dynamic routes: ${result.project.dynamicRouteCount}`);
    console.log(`tailwind pages: ${result.project.tailwindPageCount}`);
    console.log(`artifacts ok: ${result.summary.ok}`);
    console.log(`artifacts drift: ${result.summary.drift}`);
    console.log(`artifacts missing: ${result.summary.missing}`);
    console.log(`artifacts extra: ${result.summary.extra}`);
    if (!result.ok) {
      console.log(result.issues.map((issue) => `- ${issue}`).join("\n"));
    }
    return;
  }

  printUsage();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
