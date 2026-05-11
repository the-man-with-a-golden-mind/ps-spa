import { onInternalUrlRequest, renderDocument } from "./browser-runtime.generated.js";

function Text(value0) { this.value0 = value0; }
function Element(value0, value1, value2) { this.value0 = value0; this.value1 = value1; this.value2 = value2; }
function Attribute(value0, value1) { this.value0 = value0; this.value1 = value1; }
function OnClick(value0) { this.value0 = value0; }

const text = (value) => new Text(value);
const attr = (name, value) => new Attribute(name, value);
const click = (handler) => new OnClick(handler);
const node = (tag, attrs, children) => new Element(tag, attrs, children);

function run(label, iterations, fn) {
  const started = performance.now();
  for (let index = 0; index < iterations; index += 1) {
    fn(index);
  }
  const elapsed = performance.now() - started;
  return {
    averageMs: elapsed / iterations,
    iterations,
    label,
    opsPerSecond: iterations / (elapsed / 1000),
    totalMs: elapsed
  };
}

function buildDocument(title, route, sections, cardsPerSection, buttonsPerCard, links) {
  return {
    title,
    body: [
      node("main", [attr("class", "bench-shell")], [
        node("header", [attr("class", "hero")], [
          node("h1", [], [text(title)]),
          node("p", [], [text(`Real browser runtime benchmark for ${route}`)]),
          node(
            "nav",
            [attr("class", "bench-nav")],
            Array.from({ length: links }, (_, index) =>
              node("a", [attr("href", `${route}?nav=${index}`), click(() => {})], [text(`Link ${index + 1}`)])
            )
          )
        ]),
        ...Array.from({ length: sections }, (_, sectionIndex) =>
          node("section", [attr("class", "bench-section")], [
            node("h2", [], [text(`Section ${sectionIndex + 1}`)]),
            node(
              "div",
              [attr("class", "bench-cards")],
              Array.from({ length: cardsPerSection }, (_, cardIndex) =>
                node("article", [attr("class", "bench-card")], [
                  node("h3", [], [text(`Card ${sectionIndex + 1}-${cardIndex + 1}`)]),
                  node("p", [], [text(`Path ${route} item ${cardIndex + 1}`)]),
                  node(
                    "div",
                    [attr("class", "bench-actions")],
                    Array.from({ length: buttonsPerCard }, (_, buttonIndex) =>
                      node(
                        "button",
                        [attr("type", "button"), attr("data-action", `${sectionIndex}-${cardIndex}-${buttonIndex}`), click(() => {})],
                        [text(`Action ${buttonIndex + 1}`)]
                      )
                    )
                  )
                ])
              )
            )
          ])
        )
      ])
    ]
  };
}

function benchmarkRender(label, iterations, options) {
  return run(label, iterations, () => {
    renderDocument({
      document: buildDocument(options.title, options.route, options.sections, options.cardsPerSection, options.buttonsPerCard, options.links),
      rootId: "benchmark-root"
    })();
  });
}

function benchmarkRerender(label, iterations, options) {
  return run(label, iterations, () => {
    renderDocument({
      document: buildDocument(options.title, options.route, options.sections, options.cardsPerSection, options.buttonsPerCard, options.links),
      rootId: "benchmark-root"
    })();
    renderDocument({
      document: buildDocument(options.title, options.route, options.sections, options.cardsPerSection, options.buttonsPerCard, options.links),
      rootId: "benchmark-root"
    })();
  });
}

function benchmarkNavigation(label, iterations, route) {
  let seenHref = null;
  const anchor = document.createElement("a");
  anchor.href = route;
  anchor.textContent = "bench";
  document.body.appendChild(anchor);

  const cleanup = onInternalUrlRequest((href) => () => {
    seenHref = href;
  })();

  const result = run(label, iterations, () => {
    seenHref = null;
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }));
    if (seenHref !== route) {
      throw new Error(`Expected intercepted href ${route}, got ${String(seenHref)}`);
    }
  });

  cleanup();
  anchor.remove();
  return result;
}

function setStatus(textValue, className) {
  const status = document.getElementById("status");
  status.textContent = textValue;
  status.className = `status ${className}`.trim();
}

function renderResults(report) {
  const body = document.getElementById("results");
  body.innerHTML = "";

  for (const scenario of report.scenarios) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${scenario.label}</td>
      <td>${scenario.averageMs.toFixed(4)}</td>
      <td>${scenario.totalMs.toFixed(2)}</td>
      <td>${scenario.opsPerSecond.toFixed(2)}</td>
    `;
    body.appendChild(row);
  }

  document.getElementById("scenario-count").textContent = String(report.scenarios.length);
}

async function main() {
  const manifest = await fetch("./routes.generated.json").then((response) => response.json());
  document.getElementById("route-count").textContent = String(manifest.routes.length);

  const scenarios = [
    benchmarkRender("browser:render:landing-240-nodes", 500, { buttonsPerCard: 2, cardsPerSection: 6, links: 8, route: "/landing", sections: 3, title: "Landing" }),
    benchmarkRender("browser:render:dashboard-1000-nodes", 150, { buttonsPerCard: 3, cardsPerSection: 12, links: 12, route: "/dashboard", sections: 6, title: "Dashboard" }),
    benchmarkRerender("browser:rerender:dashboard-1000-nodes", 100, { buttonsPerCard: 3, cardsPerSection: 12, links: 12, route: "/dashboard", sections: 6, title: "Dashboard" })
  ];

  for (const route of manifest.routes) {
    scenarios.push(benchmarkNavigation(`browser:nav:${route.constructor}`, 30000, route.path ?? "/not-found"));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scenarioCount: scenarios.length,
    scenarios
  };

  renderResults(report);

  const response = await fetch("/__ps_spa_benchmarks", {
    body: JSON.stringify(report),
    headers: { "content-type": "application/json" },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  setStatus("Browser benchmarks completed and posted.", "ok");
}

main().catch((error) => {
  console.error(error);
  setStatus(`Benchmark failed: ${error.message}`, "error");
});
