import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { generateFiles } from "./cli/project.mjs";

const defaultPort = 4173;
const defaultTimeoutMs = 120000;
const reportDir = path.join("benchmarks", "browser-history");
const thresholdFile = path.join("benchmarks", "browser-thresholds.json");
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const options = {
    open: false,
    port: defaultPort,
    root: process.cwd(),
    timeoutMs: defaultTimeoutMs,
    verify: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--verify") {
      options.verify = true;
      continue;
    }

    if (argument === "--open") {
      options.open = true;
      continue;
    }

    if (argument === "--root") {
      options.root = path.resolve(process.cwd(), argv[index + 1] ?? ".");
      index += 1;
      continue;
    }

    if (argument === "--port") {
      options.port = Number(argv[index + 1] ?? defaultPort);
      index += 1;
      continue;
    }

    if (argument === "--timeout") {
      options.timeoutMs = Number(argv[index + 1] ?? defaultTimeoutMs);
      index += 1;
    }
  }

  return options;
}

function openUrl(url) {
  const platform = process.platform;
  let command = null;
  let args = [];

  if (platform === "darwin") {
    command = "open";
    args = [url];
  } else if (platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", url];
  } else {
    command = "xdg-open";
    args = [url];
  }

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });

  child.on("error", () => {
    console.log(`Could not auto-open ${url}. Open it manually.`);
  });

  child.unref();
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function safePathname(pathname) {
  const withoutQuery = pathname.split("?")[0];
  const normalized = path.posix.normalize(withoutQuery);
  if (normalized.includes("..")) return null;
  return normalized;
}

function resolvePublicPath(root, pathname) {
  const normalized = safePathname(pathname);
  if (normalized === null) return null;
  if (normalized === "/" || normalized === "") {
    const appIndex = path.join(root, "index.html");
    if (fs.existsSync(appIndex)) return appIndex;
    return path.join(root, "public", "index.html");
  }
  if (normalized === "/bench" || normalized === "/bench/") return path.join(root, "public", "bench", "index.html");
  return path.join(root, "public", normalized.replace(/^\//, ""));
}

function timestampFileName(isoString) {
  return isoString.replace(/[:.]/g, "-");
}

function readThresholds(root) {
  const absolutePath = path.join(root, thresholdFile);
  const fallbackPath = path.join(repoRoot, thresholdFile);
  const merged = { maxAverageMs: {} };

  if (fs.existsSync(fallbackPath)) {
    const parsed = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
    Object.assign(merged.maxAverageMs, parsed.maxAverageMs ?? {});
  }

  if (fs.existsSync(absolutePath)) {
    const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    Object.assign(merged.maxAverageMs, parsed.maxAverageMs ?? {});
  }

  return merged;
}

function evaluateThresholds(report, thresholds) {
  return report.scenarios
    .filter((scenario) => Object.prototype.hasOwnProperty.call(thresholds.maxAverageMs, scenario.label))
    .map((scenario) => {
      const maxAverageMs = thresholds.maxAverageMs[scenario.label];
      return {
        label: scenario.label,
        maxAverageMs,
        observedAverageMs: scenario.averageMs,
        ok: scenario.averageMs <= maxAverageMs
      };
    });
}

function writeReport(root, report, thresholdResults) {
  const generatedAt = report.generatedAt ?? new Date().toISOString();
  const payload = { ...report, generatedAt, thresholds: thresholdResults };
  const latestFile = path.join(reportDir, "latest.json");
  const timestampedFile = path.join(reportDir, `${timestampFileName(generatedAt)}.json`);

  for (const relativePath of [latestFile, timestampedFile]) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, `${JSON.stringify(payload, null, 2)}\n`);
  }

  return { latestFile, payload, timestampedFile };
}

function printSummary(result) {
  console.log("ps-spa browser benchmarks\n");
  for (const scenario of result.payload.scenarios) {
    console.log(
      `${scenario.label.padEnd(38)} avg ${scenario.averageMs.toFixed(4)} ms  total ${scenario.totalMs.toFixed(2)} ms  ops/s ${scenario.opsPerSecond.toFixed(2)}`
    );
  }

  console.log(`\nWrote ${result.latestFile} and ${result.timestampedFile}`);
  for (const threshold of result.payload.thresholds) {
    const status = threshold.ok ? "PASS" : "FAIL";
    console.log(`${status.padEnd(4)} ${threshold.label} <= ${threshold.maxAverageMs.toFixed(4)} ms (observed ${threshold.observedAverageMs.toFixed(4)} ms)`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const root = options.root;
  generateFiles(root);

  let finished = false;
  let timeoutId = null;

  const server = http.createServer((request, response) => {
    if (!request.url) {
      sendJson(response, 400, { error: "Missing request url" });
      return;
    }

    if (request.method === "POST" && request.url === "/__ps_spa_benchmarks") {
      const chunks = [];
      request.on("data", (chunk) => chunks.push(chunk));
      request.on("end", () => {
        try {
          const report = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          const thresholdResults = evaluateThresholds(report, readThresholds(root));
          const output = writeReport(root, report, thresholdResults);
          printSummary(output);
          sendJson(response, 200, {
            latestFile: output.latestFile,
            ok: !options.verify || thresholdResults.every((result) => result.ok),
            timestampedFile: output.timestampedFile
          });
          done(options.verify && thresholdResults.some((result) => !result.ok) ? 1 : 0);
        } catch (error) {
          sendJson(response, 500, { error: error.message });
          done(1);
        }
      });
      return;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    const filePath = resolvePublicPath(root, request.url);
    if (!filePath || !fs.existsSync(filePath)) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    response.writeHead(200, { "content-type": contentType(filePath) });
    response.end(fs.readFileSync(filePath));
  });

  const done = (exitCode) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeoutId);
    server.close(() => {
      process.exitCode = exitCode;
    });
  };

  timeoutId = setTimeout(() => {
    console.error(`Timed out waiting for browser benchmark results after ${options.timeoutMs} ms`);
    done(1);
  }, options.timeoutMs);

  server.listen(options.port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${options.port}/bench/`;
    console.log(`Open ${url} to run browser benchmarks`);
    if (options.open) {
      openUrl(url);
    }
  });
}

await main();
