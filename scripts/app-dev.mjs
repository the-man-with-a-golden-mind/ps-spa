import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

import { buildBundledApp, parseRootArgs, repoRoot, viteScript } from "./app-common.mjs";

function watchedDirectories(root) {
  return [
    path.join(repoRoot, "src"),
    path.join(root, "src")
  ].filter((directory) => fs.existsSync(directory));
}

function shouldRebuild(fileName) {
  const normalized = fileName.split(path.sep).join("/");
  if (normalized === "Generated" || normalized.startsWith("Generated/")) {
    return false;
  }

  return [".js", ".purs"].includes(path.extname(fileName));
}

async function main() {
  const options = parseRootArgs(process.argv.slice(2), {
    host: "127.0.0.1",
    port: 5173
  });
  const vite = viteScript(options.root);

  if (!fs.existsSync(vite)) {
    throw new Error(`Missing Vite in ${path.relative(process.cwd(), vite)}. Run npm install or bun install in ${path.relative(process.cwd(), options.root) || "."}.`);
  }

  let buildQueued = false;
  let buildRunning = false;

  const scheduleBuild = async () => {
    if (buildRunning) {
      buildQueued = true;
      return;
    }

    buildRunning = true;
    try {
      await buildBundledApp(options.root);
      console.log("ps-spa rebuild complete");
    } catch (error) {
      console.error(error.message);
    } finally {
      buildRunning = false;
      if (buildQueued) {
        buildQueued = false;
        await scheduleBuild();
      }
    }
  };

  await scheduleBuild();

  const watchers = watchedDirectories(options.root).map((directory) =>
    fs.watch(directory, { recursive: true }, (_eventType, fileName) => {
      if (!fileName || !shouldRebuild(fileName)) return;
      void scheduleBuild();
    })
  );

  const server = spawn(process.execPath, [vite, "--host", options.host, "--port", String(options.port)], {
    cwd: options.root,
    stdio: "inherit"
  });

  const cleanup = () => {
    for (const watcher of watchers) {
      watcher.close();
    }

    if (!server.killed) {
      server.kill("SIGTERM");
    }
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  server.on("exit", (code) => {
    cleanup();
    process.exitCode = code ?? 0;
  });

  server.on("error", (error) => {
    cleanup();
    throw error;
  });
}

await main();
