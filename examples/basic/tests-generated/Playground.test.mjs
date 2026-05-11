import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pageFile = path.join(root, "src/Pages/Playground.purs");
const generatedRouteFile = path.join(root, "src", "Generated", "Route.purs");
const generatedPagesFile = path.join(root, "src", "Generated", "Pages.purs");

test("Playground page file exists", () => {
  assert.ok(fs.existsSync(pageFile));
});

test("Playground route is registered", () => {
  const routeSource = fs.readFileSync(generatedRouteFile, "utf8");
  assert.match(routeSource, new RegExp("Playground"));
  assert.match(routeSource, new RegExp("/playground"));
});

test("Playground page loader is registered", () => {
  const pagesSource = fs.readFileSync(generatedPagesFile, "utf8");
  assert.match(pagesSource, new RegExp("Pages\\.Playground"));
  assert.match(pagesSource, new RegExp("Playground"));
});
