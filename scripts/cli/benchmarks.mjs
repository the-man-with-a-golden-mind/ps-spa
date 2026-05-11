import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const defaultBenchmarkHistoryDir = path.join("benchmarks", "history");
export const defaultBenchmarkThresholdsFile = path.join("benchmarks", "thresholds.json");
const cliDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(cliDir, "..", "..");

export async function loadScenarioFiles(rootDir, suffix) {
  if (!fs.existsSync(rootDir)) return [];

  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith(suffix)) {
        files.push(absolutePath);
      }
    }
  }

  walk(rootDir);
  files.sort();

  const scenarios = [];
  for (const file of files) {
    const module = await import(pathToFileURL(file).href);
    if (typeof module.scenarios === "function") {
      scenarios.push(...module.scenarios());
    }
  }

  return scenarios;
}

export async function collectBenchmarkScenarios(root) {
  const builtIn = await loadScenarioFiles(path.join(repoRoot, "benchmarks"), ".bench.mjs");
  const customBenchmarksDir = path.join(root, "benchmarks");
  const custom =
    path.resolve(customBenchmarksDir) === path.resolve(path.join(repoRoot, "benchmarks"))
      ? []
      : await loadScenarioFiles(customBenchmarksDir, ".bench.mjs");
  const generated = await loadScenarioFiles(path.join(root, "benchmarks-generated"), ".bench.mjs");
  return [...builtIn, ...custom, ...generated];
}

export function readBenchmarkThresholds(root, relativePath = defaultBenchmarkThresholdsFile) {
  const absolutePath = path.join(root, relativePath);
  const fallbackPath = path.join(repoRoot, relativePath);
  const merged = { maxAverageMs: {} };

  if (fs.existsSync(fallbackPath)) {
    const parsed = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
    Object.assign(merged.maxAverageMs, parsed.maxAverageMs ?? {});
  }

  if (fs.existsSync(absolutePath)) {
    const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    Object.assign(merged.maxAverageMs, parsed.maxAverageMs ?? {});
  }

  if (Object.keys(merged.maxAverageMs).length === 0) {
    return merged;
  }

  return {
    maxAverageMs: merged.maxAverageMs
  };
}

export function evaluateBenchmarks(scenarios, thresholds) {
  return scenarios
    .filter((scenario) => Object.prototype.hasOwnProperty.call(thresholds.maxAverageMs, scenario.label))
    .map((scenario) => {
      const maxAverageMs = thresholds.maxAverageMs[scenario.label];
      return {
        label: scenario.label,
        maxAverageMs,
        ok: scenario.averageMs <= maxAverageMs,
        observedAverageMs: scenario.averageMs
      };
    });
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function timestampFileName(isoString) {
  return isoString.replace(/[:.]/g, "-");
}

export function writeBenchmarkReport(root, report, options = {}) {
  const historyDir = options.historyDir ?? defaultBenchmarkHistoryDir;
  const latestFile = options.jsonOut ?? path.join(historyDir, "latest.json");
  const timestampedFile = path.join(historyDir, `${timestampFileName(report.generatedAt)}.json`);

  const latestAbsolute = path.join(root, latestFile);
  const timestampAbsolute = path.join(root, timestampedFile);
  const payload = `${JSON.stringify(report, null, 2)}\n`;

  ensureDir(latestAbsolute);
  ensureDir(timestampAbsolute);
  fs.writeFileSync(latestAbsolute, payload);
  fs.writeFileSync(timestampAbsolute, payload);

  return {
    latestFile,
    timestampedFile
  };
}

export async function runBenchmarkSuite(root, options = {}) {
  const scenarios = await collectBenchmarkScenarios(root);
  const thresholds = readBenchmarkThresholds(root, options.thresholdsFile);
  const thresholdResults = evaluateBenchmarks(scenarios, thresholds);
  const report = {
    generatedAt: new Date().toISOString(),
    scenarioCount: scenarios.length,
    scenarios: scenarios.map((scenario) => ({
      averageMs: scenario.averageMs,
      iterations: scenario.iterations,
      label: scenario.label,
      opsPerSecond: scenario.opsPerSecond,
      totalMs: scenario.totalMs
    })),
    thresholds: thresholdResults
  };

  const output = writeBenchmarkReport(root, report, options);

  return {
    output,
    report,
    scenarios,
    thresholds,
    verification: {
      failures: thresholdResults.filter((result) => !result.ok),
      ok: thresholdResults.every((result) => result.ok)
    }
  };
}
