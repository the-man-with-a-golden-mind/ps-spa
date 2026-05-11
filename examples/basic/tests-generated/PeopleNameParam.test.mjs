import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pageFile = path.join(root, "src/Pages/People/NameParam.purs");
const generatedRouteFile = path.join(root, "src", "Generated", "Route.purs");
const generatedPagesFile = path.join(root, "src", "Generated", "Pages.purs");

test("PeopleNameParam page file exists", () => {
  assert.ok(fs.existsSync(pageFile));
});

test("PeopleNameParam route is registered", () => {
  const routeSource = fs.readFileSync(generatedRouteFile, "utf8");
  assert.match(routeSource, new RegExp("PeopleNameParam"));
  assert.match(routeSource, new RegExp("people"));
});

test("PeopleNameParam page loader is registered", () => {
  const pagesSource = fs.readFileSync(generatedPagesFile, "utf8");
  assert.match(pagesSource, new RegExp("Pages\\.People\\.NameParam"));
  assert.match(pagesSource, new RegExp("PeopleNameParam"));
});
