import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function collectJsFiles(rootDir) {
  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(absolutePath);
      }
    }
  }

  walk(rootDir);
  files.sort();
  return files;
}

export function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? repoRoot,
      env: options.env ?? process.env,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? 1}`));
    });

    child.on("error", reject);
  });
}

export async function buildBundledApp(root) {
  const pursOutputAbsolute = path.join(root, "output");
  const cacheHome = path.join(root, ".cache");
  const jsRuntime = process.execPath;

  fs.mkdirSync(cacheHome, { recursive: true });

  await runCommand(jsRuntime, [path.join(repoRoot, "scripts", "ps-spa.mjs"), "--root", root, "gen"], { cwd: root });
  await runCommand(
    "spago",
    ["-x", "spago.dhall", "-c", "skip", "build"],
    {
      cwd: root,
      env: { ...process.env, XDG_CACHE_HOME: cacheHome }
    }
  );
  await runCommand(
    "purs",
    ["bundle", ...collectJsFiles(pursOutputAbsolute), "-m", "Main", "--main", "Main", "-o", path.join("public", "app.js")],
    { cwd: root }
  );
}
