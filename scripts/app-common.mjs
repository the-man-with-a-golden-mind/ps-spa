import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseRootArgs(argv, defaults = {}) {
  const options = {
    root: process.cwd(),
    ...defaults
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--root") {
      options.root = path.resolve(process.cwd(), argv[index + 1] ?? ".");
      index += 1;
      continue;
    }

    if (argument === "--host") {
      options.host = argv[index + 1] ?? options.host;
      index += 1;
      continue;
    }

    if (argument === "--port") {
      options.port = Number(argv[index + 1] ?? options.port);
      index += 1;
    }
  }

  return options;
}

export function viteScript(root) {
  return path.join(root, "node_modules", "vite", "bin", "vite.js");
}

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
  const pursOutputAbsolute = path.join(root, ".spago-output");
  const jsRuntime = process.execPath;

  await runCommand(jsRuntime, [path.join(repoRoot, "scripts", "ps-spa.mjs"), "--root", root, "gen"], { cwd: root });
  await runCommand(
    "spago",
    ["-x", "spago.dhall", "-c", "skip", "build", "-u", "--output .spago-output"],
    {
      cwd: root,
      env: { ...process.env, XDG_CACHE_HOME: path.join(repoRoot, ".cache") }
    }
  );
  await runCommand(
    "purs",
    ["bundle", ...collectJsFiles(pursOutputAbsolute), "-m", "Main", "--main", "Main", "-o", path.join("public", "app.js")],
    { cwd: root }
  );
}
