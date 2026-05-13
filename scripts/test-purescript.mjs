#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { runCommand, repoRoot } from "./app-common.mjs";

const outputDir = path.join(repoRoot, "output");
const env = {
  ...process.env,
  XDG_CACHE_HOME: path.join(repoRoot, ".cache")
};

await runCommand("spago", ["-x", "test.dhall", "-c", "skip", "build"], {
  cwd: repoRoot,
  env
});

fs.writeFileSync(path.join(outputDir, "package.json"), '{ "type": "commonjs" }\n');

await runCommand("node", ["-e", "require('./output/Test.Main').main()"], {
  cwd: repoRoot,
  env
});
