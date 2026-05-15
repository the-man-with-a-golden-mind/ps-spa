import path from "node:path";
import process from "node:process";

import { buildBundledApp } from "./app-common.mjs";

const IGNORED_PREFIXES = [
  "src/Generated/",
  "output/",
  ".spago/",
  ".spago-output/",
  ".cache/",
  "tests-generated/",
  "benchmarks-generated/",
  "public/",
  "dist/",
  "node_modules/"
];

function shouldRebuild(root, filePath) {
  const relative = path.relative(root, filePath).split(path.sep).join("/");

  if (relative === "" || relative.startsWith("..")) return false;
  if (IGNORED_PREFIXES.some((prefix) => relative.startsWith(prefix))) return false;

  if (relative === "spago.dhall") return true;

  const ext = path.extname(filePath);
  if (ext !== ".purs" && ext !== ".js") return false;

  return relative.startsWith("src/");
}

function reportBuildError(serverRef, error) {
  const message = error?.message ?? String(error);
  // The spago/purs subprocess already streamed its diagnostics to the terminal
  // (stdio: "inherit"), so this is a short header rather than the full output.
  // eslint-disable-next-line no-console
  console.error(`\n[ps-spa] build failed — keeping dev server running. ${message}\n`);

  if (serverRef) {
    serverRef.ws.send({
      type: "error",
      err: {
        message: `ps-spa build failed: ${message}`,
        stack: error?.stack ?? "",
        plugin: "ps-spa-vite"
      }
    });
  }
}

export function psSpaVite(options = {}) {
  const root = path.resolve(options.root ?? process.cwd());

  let command = "serve";
  let buildQueued = false;
  let buildRunning = false;
  let serverRef = null;

  const runBuild = async () => {
    try {
      await buildBundledApp(root);
      if (serverRef) {
        serverRef.ws.send({ type: "full-reload" });
      }
      return true;
    } catch (error) {
      reportBuildError(serverRef, error);
      return false;
    }
  };

  const scheduleBuild = async () => {
    if (buildRunning) {
      buildQueued = true;
      return;
    }

    buildRunning = true;

    try {
      await runBuild();
    } finally {
      buildRunning = false;
      if (buildQueued) {
        buildQueued = false;
        await scheduleBuild();
      }
    }
  };

  return {
    name: "ps-spa-vite",
    configResolved(config) {
      command = config.command;
    },
    async buildStart() {
      // Dev mode (serve) builds via configureServer; only one-shot `vite build` needs us here.
      // For a production build we want a hard failure on compile errors so we don't ship a stale bundle.
      if (command === "build" && !this.meta.watchMode) {
        await buildBundledApp(root);
      }
    },
    configureServer(server) {
      serverRef = server;

      server.watcher.on("all", (_event, filePath) => {
        if (shouldRebuild(root, filePath)) {
          void scheduleBuild();
        }
      });

      void scheduleBuild();
    }
  };
}
