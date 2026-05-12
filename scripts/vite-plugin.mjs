import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { buildBundledApp, repoRoot } from "./app-common.mjs";

function watchedDirectories(root) {
  return [
    path.join(root, "src"),
    path.join(repoRoot, "src")
  ].filter((directory) => fs.existsSync(directory));
}

function shouldRebuild(filePath) {
  const normalized = filePath.split(path.sep).join("/");

  if (normalized.includes("/src/Generated/")) {
    return false;
  }

  const ext = path.extname(filePath);
  return ext === ".purs" || ext === ".js" || path.basename(filePath) === "spago.dhall";
}

export function psSpaVite(options = {}) {
  const root = path.resolve(options.root ?? process.cwd());

  let buildQueued = false;
  let buildRunning = false;
  let serverRef = null;
  let watchers = [];

  const cleanup = () => {
    for (const watcher of watchers) {
      watcher.close();
    }

    watchers = [];
  };

  const scheduleBuild = async () => {
    if (buildRunning) {
      buildQueued = true;
      return;
    }

    buildRunning = true;

    try {
      await buildBundledApp(root);
      if (serverRef) {
        serverRef.ws.send({ type: "full-reload" });
      }
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
    async buildStart() {
      if (!this.meta.watchMode) {
        await buildBundledApp(root);
      }
    },
    configureServer(server) {
      serverRef = server;
      watchers = watchedDirectories(root).map((directory) =>
        fs.watch(directory, { recursive: true }, (_eventType, fileName) => {
          if (!fileName) return;

          const absolutePath = path.join(directory, String(fileName));
          if (!shouldRebuild(absolutePath)) return;

          void scheduleBuild();
        })
      );

      void scheduleBuild();

      server.httpServer?.once("close", cleanup);

      return cleanup;
    }
  };
}
