import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

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
  const cacheHome = path.join(root, ".cache");
  const jsRuntime = process.execPath;

  fs.mkdirSync(cacheHome, { recursive: true });

  // Make locally-installed binaries (e.g. esbuild used by `spago bundle`) findable.
  const localBin = path.join(root, "node_modules", ".bin");
  const env = {
    ...process.env,
    XDG_CACHE_HOME: cacheHome,
    PATH: `${localBin}${path.delimiter}${process.env.PATH ?? ""}`
  };

  await runCommand(jsRuntime, [path.join(repoRoot, "scripts", "ps-spa.mjs"), "--root", root, "gen"], { cwd: root, env });
  await runCommand("spago", ["build"], { cwd: root, env });
  await runCommand(
    "spago",
    ["bundle", "--module", "Main", "--outfile", path.join("public", "app.js"), "--platform", "browser"],
    { cwd: root, env }
  );
}
