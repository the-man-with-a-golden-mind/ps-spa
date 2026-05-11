import path from "node:path";
import process from "node:process";
import { runBenchmarkSuite } from "./cli/benchmarks.mjs";

function parseArgs(argv) {
  const options = {
    historyDir: undefined,
    jsonOut: undefined,
    root: process.cwd(),
    thresholdsFile: undefined,
    verify: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--verify") {
      options.verify = true;
      continue;
    }

    if (argument === "--root") {
      options.root = path.resolve(process.cwd(), argv[index + 1] ?? ".");
      index += 1;
      continue;
    }

    if (argument === "--json-out") {
      options.jsonOut = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === "--history-dir") {
      options.historyDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === "--thresholds") {
      options.thresholdsFile = argv[index + 1];
      index += 1;
    }
  }

  return options;
}

function printScenario(scenario) {
  const average = scenario.averageMs.toFixed(4);
  const total = scenario.totalMs.toFixed(2);
  const ops = scenario.opsPerSecond.toFixed(2);
  console.log(`${scenario.label.padEnd(34)} avg ${average} ms  total ${total} ms  ops/s ${ops}`);
}

const options = parseArgs(process.argv.slice(2));
const result = await runBenchmarkSuite(options.root, options);
const { scenarios } = result;

if (scenarios.length === 0) {
  console.log("No benchmark scenarios found.");
  process.exit(0);
}

console.log("ps-spa benchmarks\n");
for (const scenario of scenarios) {
  printScenario(scenario);
}

console.log(`\nWrote ${result.output.latestFile} and ${result.output.timestampedFile}`);

if (result.report.thresholds.length > 0) {
  for (const threshold of result.report.thresholds) {
    const status = threshold.ok ? "PASS" : "FAIL";
    console.log(
      `${status.padEnd(4)} ${threshold.label} <= ${threshold.maxAverageMs.toFixed(4)} ms (observed ${threshold.observedAverageMs.toFixed(4)} ms)`
    );
  }
}

if (options.verify && !result.verification.ok) {
  process.exitCode = 1;
}
