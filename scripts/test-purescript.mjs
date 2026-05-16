#!/usr/bin/env node

import path from "node:path";
import process from "node:process";

import { runCommand, repoRoot } from "./app-common.mjs";

// `spago test` reads spago.yaml's `package.test` block and runs Test.Main
// against the modern ESM output. The legacy `-x test.dhall -c skip build`
// dance + require() is no longer needed.
const env = {
  ...process.env,
  XDG_CACHE_HOME: path.join(repoRoot, ".cache")
};

await runCommand("spago", ["test"], { cwd: repoRoot, env });
