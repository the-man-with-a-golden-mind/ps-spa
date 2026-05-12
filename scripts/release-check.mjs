#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { collectAppScaffoldFiles } from "./cli/scaffold.mjs";

const packageRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requireField(condition, message, failures) {
  if (!condition) {
    failures.push(message);
  }
}

function main() {
  const failures = [];
  const pkg = readJson(path.join(packageRoot, "package.json"));
  const cliSource = fs.readFileSync(path.join(packageRoot, "scripts", "ps-spa.mjs"), "utf8");
  const spagoYamlPath = path.join(packageRoot, "spago.yaml");
  const spagoYamlSource = fs.existsSync(spagoYamlPath) ? fs.readFileSync(spagoYamlPath, "utf8") : "";

  requireField(pkg.private === false, "package.json must set private=false for release", failures);
  requireField(pkg.license === "MIT", "package.json must declare MIT license", failures);
  requireField(typeof pkg.repository?.url === "string" && pkg.repository.url.length > 0, "package.json must declare repository.url", failures);
  requireField(typeof pkg.homepage === "string" && pkg.homepage.length > 0, "package.json must declare homepage", failures);
  requireField(typeof pkg.bugs?.url === "string" && pkg.bugs.url.length > 0, "package.json must declare bugs.url", failures);
  requireField(pkg.publishConfig?.access === "public", "package.json must set publishConfig.access=public", failures);
  requireField(pkg.bin?.["ps-spa"] === "./scripts/ps-spa.mjs", "package.json must expose the ps-spa bin entry", failures);
  requireField(Array.isArray(pkg.files) && pkg.files.includes("src"), "package.json files must include src", failures);
  requireField(Array.isArray(pkg.files) && pkg.files.includes("scripts"), "package.json files must include scripts", failures);
  requireField(Array.isArray(pkg.files) && pkg.files.includes("LICENSE"), "package.json files must include LICENSE", failures);
  requireField(Array.isArray(pkg.files) && pkg.files.includes("spago.yaml"), "package.json files must include spago.yaml", failures);
  requireField(cliSource.startsWith("#!/usr/bin/env node"), "scripts/ps-spa.mjs must keep a node shebang", failures);
  requireField(fs.existsSync(path.join(packageRoot, "LICENSE")), "LICENSE file is missing", failures);
  requireField(fs.existsSync(spagoYamlPath), "spago.yaml is missing", failures);
  requireField(/package:\s*\n\s*name:\s*ps-spa/.test(spagoYamlSource), "spago.yaml must declare package.name = ps-spa", failures);
  requireField(/publish:\s*\n\s*version:\s*0\.1\.0/.test(spagoYamlSource), "spago.yaml must declare publish.version", failures);
  requireField(/license:\s*MIT/.test(spagoYamlSource), "spago.yaml must declare publish.license = MIT", failures);
  requireField(/githubOwner:\s*the-man-with-a-golden-mind/.test(spagoYamlSource), "spago.yaml must declare publish.location.githubOwner", failures);
  requireField(/githubRepo:\s*ps-spa/.test(spagoYamlSource), "spago.yaml must declare publish.location.githubRepo", failures);

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ps-spa-release-check-"));
  const installedPackageRoot = path.join(tmpRoot, "demo-app", "node_modules", "ps-spa");
  const appRoot = path.join(tmpRoot, "demo-app");
  const files = collectAppScaffoldFiles(appRoot, installedPackageRoot);
  const scaffoldPackage = JSON.parse(files.find((file) => file.relativePath === "package.json").content);
  const scaffoldSpago = files.find((file) => file.relativePath === "spago.dhall").content;

  requireField(
    scaffoldPackage.packageManager === "bun@1.3.9",
    "scaffolded app must declare a Bun packageManager for the default Vite workflow",
    failures
  );
  requireField(
    scaffoldPackage.scripts.build === "bunx --bun vite build",
    "scaffolded app build script must use Bun-native vite build",
    failures
  );
  requireField(
    scaffoldPackage.scripts.dev === "bunx --bun vite",
    "scaffolded app dev script must use Bun-native vite",
    failures
  );
  requireField(
    files.some((file) => file.relativePath === "vite.config.mjs" && file.content.includes('psSpaVite')),
    "scaffolded app must include vite.config.mjs wired to psSpaVite",
    failures
  );
  requireField(
    scaffoldSpago.includes('packages = ./node_modules/ps-spa/packages.dhall'),
    "scaffolded spago.dhall must reference node_modules/ps-spa/packages.dhall",
    failures
  );
  requireField(
    scaffoldSpago.includes('"node_modules/ps-spa/src/**/*.purs"'),
    "scaffolded spago.dhall must reference node_modules/ps-spa/src/**/*.purs",
    failures
  );

  if (failures.length > 0) {
    throw new Error(`Release check failed\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  }

  console.log("Release check passed");
}

main();
