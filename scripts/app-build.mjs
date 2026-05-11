import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { buildBundledApp, parseRootArgs, runCommand, viteBinary } from "./app-common.mjs";

async function main() {
  const options = parseRootArgs(process.argv.slice(2));
  const vite = viteBinary(options.root);

  if (!fs.existsSync(vite)) {
    throw new Error(`Missing Vite in ${path.relative(process.cwd(), vite)}. Run npm install or bun install in ${path.relative(process.cwd(), options.root) || "."}.`);
  }
  await buildBundledApp(options.root);
  await runCommand(vite, ["build"], { cwd: options.root });
}

await main();
