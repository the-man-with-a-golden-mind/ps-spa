import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { collectAppScaffoldFiles } from "../scripts/cli/scaffold.mjs";
import {
  addPage,
  browserBenchmarkManifestFile,
  browserBenchmarkRuntimeFile,
  compareRoutes,
  ensureTailwindScaffold,
  doctorProject,
  generateAppModule,
  generateLinkModule,
  generatePageTemplate,
  generatePagesModule,
  generateRouteModule,
  pageFileToRouteInfo,
  pascalToKebab,
  routeToPageFile,
  runBenchmarkSuite,
  titleFromRoute
} from "../scripts/ps-spa.mjs";

const packageManifest = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("pascalToKebab matches Elm SPA style segments", () => {
  assert.equal(pascalToKebab("AboutUs"), "about-us");
  assert.equal(pascalToKebab("APIKey"), "api-key");
});

test("pageFileToRouteInfo handles home, static, dynamic and not-found pages", () => {
  assert.deepEqual(pageFileToRouteInfo("src/Pages/Index.purs"), {
    constructor: "Index",
    dynamicParams: [],
    isNotFound: false,
    moduleName: "Pages.Index",
    pageFile: "src/Pages/Index.purs",
    path: "/",
    routePattern: "/",
    routeSegments: ["Index"]
  });

  assert.deepEqual(pageFileToRouteInfo("src/Pages/AboutUs.purs"), {
    constructor: "AboutUs",
    dynamicParams: [],
    isNotFound: false,
    moduleName: "Pages.AboutUs",
    pageFile: "src/Pages/AboutUs.purs",
    path: "/about-us",
    routePattern: "/about-us",
    routeSegments: ["AboutUs"]
  });

  assert.deepEqual(pageFileToRouteInfo("src/Pages/People/NameParam.purs"), {
    constructor: "PeopleNameParam",
    dynamicParams: ["name"],
    isNotFound: false,
    moduleName: "Pages.People.NameParam",
    pageFile: "src/Pages/People/NameParam.purs",
    path: "/people/:name",
    routePattern: "/people/:name",
    routeSegments: ["People", "NameParam"]
  });

  assert.deepEqual(pageFileToRouteInfo("src/Pages/NotFound.purs"), {
    constructor: "NotFound",
    dynamicParams: [],
    isNotFound: true,
    moduleName: "Pages.NotFound",
    pageFile: "src/Pages/NotFound.purs",
    path: null,
    routePattern: "/not-found",
    routeSegments: []
  });
});

test("routeToPageFile mirrors elm-spa add style file generation", () => {
  assert.equal(routeToPageFile("/"), "src/Pages/Index.purs");
  assert.equal(routeToPageFile("/people/:name"), "src/Pages/People/NameParam.purs");
  assert.equal(
    routeToPageFile("/users/:name/posts/:id"),
    "src/Pages/Users/NameParam/Posts/IdParam.purs"
  );
});

test("compareRoutes prefers more specific paths before dynamic ones", () => {
  const routes = [
    pageFileToRouteInfo("src/Pages/People/NameParam.purs"),
    pageFileToRouteInfo("src/Pages/People/New.purs"),
    pageFileToRouteInfo("src/Pages/Index.purs")
  ];

  routes.sort(compareRoutes);

  assert.deepEqual(routes.map((route) => route.path), [
    "/people/new",
    "/people/:name",
    "/"
  ]);
});

test("generateRouteModule includes parsePath and toPath branches", () => {
  const moduleSource = generateRouteModule([
    pageFileToRouteInfo("src/Pages/Index.purs"),
    pageFileToRouteInfo("src/Pages/People/NameParam.purs"),
    pageFileToRouteInfo("src/Pages/NotFound.purs")
  ]);

  assert.match(moduleSource, /data Route/);
  assert.match(moduleSource, /\= Index/);
  assert.match(moduleSource, /\| PeopleNameParam \{ name :: String \}/);
  assert.match(moduleSource, /parsePath :: String -> Route/);
  assert.match(moduleSource, /parseRequest :: String -> Request/);
  assert.match(moduleSource, /\[ "people", name \] -> PeopleNameParam \{ name: name \}/);
  assert.match(moduleSource, /PeopleNameParam params -> "" <> "\/people" <> "\/" <> params.name/);
  assert.match(moduleSource, /parseQuery :: String -> Array SpaRequest\.QueryParam/);
});

test("generatePagesModule wires routes to generated page metadata", () => {
  const source = generatePagesModule([
    pageFileToRouteInfo("src/Pages/Index.purs"),
    pageFileToRouteInfo("src/Pages/People/NameParam.purs"),
    pageFileToRouteInfo("src/Pages/NotFound.purs")
  ]);

  assert.match(source, /module Generated.Pages/);
  assert.match(source, /import Pages.Index as IndexPage/);
  assert.match(source, /pageForRoute :: Route -> PageMeta/);
  assert.match(source, /PeopleNameParam _ -> metaPeopleNameParam/);
  assert.match(source, /loadPage shared request =/);
  assert.match(source, /unsafeDecide IndexPage\.page IndexPage\.protect shared request/);
});

test("generateAppModule provides a default and extensible app entrypoint", () => {
  const source = generateAppModule();

  assert.match(source, /module Generated\.App/);
  assert.match(source, /type AppConfig shared command subscription/);
  assert.match(source, /start :: Effect Unit/);
  assert.match(source, /startWith :: forall shared command subscription/);
  assert.match(source, /loadPage: Pages\.loadPage/);
});

test("generateLinkModule exposes typed route links", () => {
  const source = generateLinkModule();

  assert.match(source, /module Generated\.Link/);
  assert.match(source, /href :: forall msg\. Route -> Html\.Attribute msg/);
  assert.match(source, /link :: forall msg\. Route -> Array/);
  assert.match(source, /Html\.a \(\[ href route \] <> attrs\) children/);
});

test("generated modules match snapshots for a canonical route tree", () => {
  const routes = [
    pageFileToRouteInfo("src/Pages/Index.purs"),
    pageFileToRouteInfo("src/Pages/People/NameParam.purs"),
    pageFileToRouteInfo("src/Pages/NotFound.purs")
  ];

  const routeSnapshot = fs.readFileSync(path.join("tests-js", "snapshots", "generated-route.purs"), "utf8");
  const pagesSnapshot = fs.readFileSync(path.join("tests-js", "snapshots", "generated-pages.purs"), "utf8");

  assert.equal(generateRouteModule(routes), routeSnapshot);
  assert.equal(generatePagesModule(routes), pagesSnapshot);
});

test("generatePageTemplate emits real advanced page code with subscriptions", () => {
  const source = generatePageTemplate("/settings/users", "advanced");

  assert.match(source, /module Pages\.Settings\.Users/);
  assert.match(source, /import Generated\.Link as Link/);
  assert.match(source, /import Generated\.Route \(Request, Route\(\.\.\)\)/);
  assert.match(source, /page :: forall shared command subscription\. Request -> Page\.Page/);
  assert.match(source, /protect :: forall shared\. shared -> Request -> Maybe Route/);
  assert.match(source, /subscriptions :: forall subscription\. Model -> Array \(subscription Msg\)/);
  assert.match(source, /kind = Advanced/);
});

test("titleFromRoute produces readable page titles", () => {
  assert.equal(titleFromRoute("/"), "Home");
  assert.equal(titleFromRoute("/about-us"), "About Us");
  assert.equal(titleFromRoute("/users/:name/posts"), "Users Name Posts");
});

test("collectAppScaffoldFiles targets installed package paths for consumer apps", () => {
  const appRoot = path.join("/tmp", "consumer-app");
  const packageRoot = path.join(appRoot, "node_modules", "ps-spa");
  const files = collectAppScaffoldFiles(appRoot, packageRoot);
  const pkg = JSON.parse(files.find((file) => file.relativePath === "package.json").content);
  const spago = files.find((file) => file.relativePath === "spago.dhall").content;
  const viteConfig = files.find((file) => file.relativePath === "vite.config.mjs").content;

  assert.equal(pkg.packageManager, "bun@1.3.9");
  assert.equal(pkg.scripts.build, "bunx --bun vite build");
  assert.equal(pkg.scripts.dev, "bunx --bun vite");
  assert.equal(pkg.dependencies["ps-spa"], `^${packageManifest.version}`);
  assert.match(spago, /packages = \.\/node_modules\/ps-spa\/packages\.dhall/);
  assert.match(spago, /"node_modules\/ps-spa\/src\/\*\*\/\*\.purs"/);
  assert.match(viteConfig, /import \{ psSpaVite \} from "ps-spa\/scripts\/vite-plugin\.mjs"/);
  assert.match(viteConfig, /plugins: \[psSpaVite\(\)\]/);
});

test("collectAppScaffoldFiles uses a file dependency when scaffolding from the source repo", () => {
  const appRoot = path.join("/tmp", "repo-app");
  const files = collectAppScaffoldFiles(appRoot);
  const pkg = JSON.parse(files.find((file) => file.relativePath === "package.json").content);

  assert.match(pkg.dependencies["ps-spa"], /^file:/);
});

test("ensureTailwindScaffold patches package.json and creates config files", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ps-spa-tailwind-"));
  fs.writeFileSync(
    path.join(tmp, "package.json"),
    JSON.stringify(
      {
        name: "tmp-ps-spa",
        private: true,
        type: "module",
        scripts: {}
      },
      null,
      2
    )
  );

  ensureTailwindScaffold(tmp);

  const pkg = JSON.parse(fs.readFileSync(path.join(tmp, "package.json"), "utf8"));
  assert.equal(pkg.devDependencies.tailwindcss, "^3.4.17");
  assert.ok(fs.existsSync(path.join(tmp, "tailwind.config.cjs")));
  assert.ok(fs.existsSync(path.join(tmp, "postcss.config.cjs")));
  assert.ok(fs.existsSync(path.join(tmp, "styles", "tailwind.css")));
});

test("addPage creates a tailwind page and regenerates route plus page registries", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ps-spa-add-"));
  fs.mkdirSync(path.join(tmp, "src", "Pages"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "src", "Pages", "Index.purs"), "module Pages.Index where\n");
  fs.writeFileSync(path.join(tmp, "src", "Pages", "NotFound.purs"), "module Pages.NotFound where\n");
  fs.writeFileSync(
    path.join(tmp, "package.json"),
    JSON.stringify({ name: "tmp-ps-spa", private: true, type: "module", scripts: {} }, null, 2)
  );

  const result = addPage(tmp, "/marketing/hero", "tailwind");

  assert.equal(result.created, "src/Pages/Marketing/Hero.purs");
  assert.ok(fs.existsSync(path.join(tmp, "src", "Generated", "Route.purs")));
  assert.ok(fs.existsSync(path.join(tmp, "src", "Generated", "Pages.purs")));
  assert.ok(fs.existsSync(path.join(tmp, "src", "Generated", "App.purs")));
  assert.ok(fs.existsSync(path.join(tmp, "src", "Generated", "Link.purs")));
  assert.ok(fs.existsSync(path.join(tmp, "tailwind.config.cjs")));
  assert.ok(fs.existsSync(path.join(tmp, "tests-generated", "MarketingHero.test.mjs")));
  assert.ok(fs.existsSync(path.join(tmp, "benchmarks-generated", "MarketingHero.bench.mjs")));
  assert.ok(fs.existsSync(path.join(tmp, browserBenchmarkManifestFile())));
  assert.ok(fs.existsSync(path.join(tmp, browserBenchmarkRuntimeFile())));
  assert.match(
    fs.readFileSync(path.join(tmp, "src", "Pages", "Marketing", "Hero.purs"), "utf8"),
    /kind = Tailwind/
  );
  assert.match(
    fs.readFileSync(path.join(tmp, "src", "Generated", "App.purs"), "utf8"),
    /module Generated\.App/
  );
  assert.match(
    fs.readFileSync(path.join(tmp, "src", "Generated", "Link.purs"), "utf8"),
    /module Generated\.Link/
  );
  assert.match(
    fs.readFileSync(path.join(tmp, "tests-generated", "MarketingHero.test.mjs"), "utf8"),
    /MarketingHero route is registered/
  );
  assert.match(
    fs.readFileSync(path.join(tmp, "benchmarks-generated", "MarketingHero.bench.mjs"), "utf8"),
    /MarketingHero:render/
  );
  assert.match(
    fs.readFileSync(path.join(tmp, browserBenchmarkManifestFile()), "utf8"),
    /"constructor": "MarketingHero"/
  );
});

test("doctorProject reports a clean generated project", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ps-spa-doctor-"));
  fs.mkdirSync(path.join(tmp, "src", "Pages"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "src", "Pages", "Index.purs"), "module Pages.Index where\n");
  fs.writeFileSync(path.join(tmp, "src", "Pages", "NotFound.purs"), "module Pages.NotFound where\n");
  fs.writeFileSync(
    path.join(tmp, "package.json"),
    JSON.stringify({ name: "tmp-ps-spa", private: true, type: "module", scripts: {} }, null, 2)
  );

  addPage(tmp, "/marketing/hero", "tailwind");
  const result = doctorProject(tmp);

  assert.equal(result.ok, true);
  assert.equal(result.project.pageCount, 3);
  assert.equal(result.project.tailwindPageCount, 1);
  assert.equal(result.summary.missing, 0);
  assert.equal(result.summary.drift, 0);
});

test("doctorProject detects generated drift", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ps-spa-drift-"));
  fs.mkdirSync(path.join(tmp, "src", "Pages"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "src", "Pages", "Index.purs"), "module Pages.Index where\n");
  fs.writeFileSync(path.join(tmp, "src", "Pages", "NotFound.purs"), "module Pages.NotFound where\n");
  fs.writeFileSync(
    path.join(tmp, "package.json"),
    JSON.stringify({ name: "tmp-ps-spa", private: true, type: "module", scripts: {} }, null, 2)
  );

  addPage(tmp, "/marketing/hero", "static");
  fs.writeFileSync(path.join(tmp, "src", "Generated", "Route.purs"), "broken\n");

  const result = doctorProject(tmp);

  assert.equal(result.ok, false);
  assert.match(result.issues.join("\n"), /DRIFT: src\/Generated\/Route\.purs/);
});

test("runBenchmarkSuite writes history JSON and evaluates thresholds", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ps-spa-bench-suite-"));
  fs.mkdirSync(path.join(tmp, "benchmarks"), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, "benchmarks", "sample.bench.mjs"),
    `export function scenarios() {
  return [
    {
      label: "sample:fast",
      iterations: 10,
      totalMs: 5,
      averageMs: 0.5,
      opsPerSecond: 20
    }
  ];
}
`
  );
  fs.writeFileSync(
    path.join(tmp, "benchmarks", "thresholds.json"),
    JSON.stringify({ maxAverageMs: { "sample:fast": 1 } }, null, 2)
  );

  const result = await runBenchmarkSuite(tmp);

  assert.equal(result.verification.ok, true);
  assert.ok(fs.existsSync(path.join(tmp, "benchmarks", "history", "latest.json")));
  assert.equal(
    result.report.scenarios.some((scenario) => scenario.label === "sample:fast"),
    true
  );
});

test("runBenchmarkSuite flags threshold regressions", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ps-spa-bench-regress-"));
  fs.mkdirSync(path.join(tmp, "benchmarks"), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, "benchmarks", "sample.bench.mjs"),
    `export function scenarios() {
  return [
    {
      label: "sample:slow",
      iterations: 10,
      totalMs: 50,
      averageMs: 5,
      opsPerSecond: 2
    }
  ];
}
`
  );
  fs.writeFileSync(
    path.join(tmp, "benchmarks", "thresholds.json"),
    JSON.stringify({ maxAverageMs: { "sample:slow": 1 } }, null, 2)
  );

  const result = await runBenchmarkSuite(tmp);

  assert.equal(result.verification.ok, false);
  assert.equal(
    result.verification.failures.some((failure) => failure.label === "sample:slow"),
    true
  );
});
