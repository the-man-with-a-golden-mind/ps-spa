import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pageFile = path.join(root, "src/Pages/Marketing/Hero.purs");
const generatedRouteFile = path.join(root, "src", "Generated", "Route.purs");
const generatedPagesFile = path.join(root, "src", "Generated", "Pages.purs");

test("MarketingHero page file exists", () => {
  assert.ok(fs.existsSync(pageFile));
});

test("MarketingHero route is registered", () => {
  const routeSource = fs.readFileSync(generatedRouteFile, "utf8");
  assert.match(routeSource, new RegExp("MarketingHero"));
  assert.match(routeSource, new RegExp("/marketing/hero"));
});

test("MarketingHero page loader is registered", () => {
  const pagesSource = fs.readFileSync(generatedPagesFile, "utf8");
  assert.match(pagesSource, new RegExp("Pages\\.Marketing\\.Hero"));
  assert.match(pagesSource, new RegExp("MarketingHero"));
});
