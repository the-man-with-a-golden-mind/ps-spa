import fs from "node:fs";
import path from "node:path";

import { syncBrowserBenchmarkArtifacts } from "./browser-bench.mjs";
import { generateAppModule, generateLinkModule, generatePagesModule, generateRouteModule } from "./codegen.mjs";
import { syncQualityArtifacts } from "./quality.mjs";
import { scanPages, routeToPageFile } from "./routes.mjs";
import { collectAppScaffoldFiles } from "./scaffold.mjs";
import { ensureTailwindScaffold } from "./tailwind.mjs";
import { generatePageTemplate } from "./templates.mjs";

const templates = new Set(["static", "sandbox", "element", "advanced", "tailwind"]);

function ensureEmptyRoot(root) {
  if (fs.existsSync(root) && fs.readdirSync(root).length > 0) {
    throw new Error(`Target directory is not empty: ${path.relative(process.cwd(), root) || "."}`);
  }

  fs.mkdirSync(root, { recursive: true });
}

function writeTextFile(root, relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

export function createApp(root) {
  ensureEmptyRoot(root);

  for (const file of collectAppScaffoldFiles(root)) {
    writeTextFile(root, file.relativePath, file.content);
  }

  const homeFile = routeToPageFile("/");
  const notFoundFile = routeToPageFile("/not-found");
  writeTextFile(root, homeFile, generatePageTemplate("/", "static"));
  writeTextFile(root, notFoundFile, generatePageTemplate("/not-found", "static"));

  const generated = generateFiles(root);

  return {
    createdFiles: [...collectAppScaffoldFiles(root).map((file) => file.relativePath), homeFile, notFoundFile],
    generated
  };
}

export function addPage(root, route, template = "static") {
  if (!templates.has(template)) {
    throw new Error(`Unknown template "${template}". Expected one of: ${Array.from(templates).join(", ")}`);
  }

  const relativeFile = routeToPageFile(route);
  const absoluteFile = path.join(root, relativeFile);

  fs.mkdirSync(path.dirname(absoluteFile), { recursive: true });

  if (fs.existsSync(absoluteFile)) {
    throw new Error(`Page already exists at ${relativeFile}`);
  }

  fs.writeFileSync(absoluteFile, generatePageTemplate(route, template));

  if (template === "tailwind") {
    ensureTailwindScaffold(root);
  }

  const generated = generateFiles(root);

  return {
    created: relativeFile,
    generated
  };
}

export function generateFiles(root) {
  const routes = scanPages(root);
  const generatedDir = path.join(root, "src", "Generated");
  const generatedAppFile = path.join(generatedDir, "App.purs");
  const generatedLinkFile = path.join(generatedDir, "Link.purs");
  const generatedRouteFile = path.join(generatedDir, "Route.purs");
  const generatedPagesFile = path.join(generatedDir, "Pages.purs");

  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(generatedAppFile, generateAppModule());
  fs.writeFileSync(generatedLinkFile, generateLinkModule());
  fs.writeFileSync(generatedRouteFile, generateRouteModule(routes));
  fs.writeFileSync(generatedPagesFile, generatePagesModule(routes));
  const quality = syncQualityArtifacts(root, routes);
  const browserBenchmarkFiles = syncBrowserBenchmarkArtifacts(root, routes);

  return {
    generatedBrowserBenchmarkFiles: browserBenchmarkFiles,
    generatedAppFile: path.relative(root, generatedAppFile),
    generatedBenchmarks: quality.generatedBenchmarks,
    generatedLinkFile: path.relative(root, generatedLinkFile),
    generatedPagesFile: path.relative(root, generatedPagesFile),
    generatedRouteFile: path.relative(root, generatedRouteFile),
    generatedTests: quality.generatedTests,
    routes
  };
}
