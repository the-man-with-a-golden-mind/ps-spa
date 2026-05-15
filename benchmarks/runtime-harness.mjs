import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { performance } from "node:perf_hooks";

// Browser.js is shipped as an ES module (`export const X = ...`), but the harness
// evaluates it inside `vm.Script` (classic script context). Rewrite the exports
// inline so they land on `module.exports` like before.
const browserSource = fs
  .readFileSync(path.join(process.cwd(), "src", "PsSpa", "Browser.js"), "utf8")
  .replace(/^export\s+const\s+(\w+)\s*=\s*/gm, "module.exports.$1 = ");

function Text(value0) {
  this.value0 = value0;
}

function Element(value0, value1, value2) {
  this.value0 = value0;
  this.value1 = value1;
  this.value2 = value2;
}

function Attribute(value0, value1) {
  this.value0 = value0;
  this.value1 = value1;
}

function OnClick(value0) {
  this.value0 = value0;
}

function text(value) {
  return new Text(value);
}

function attr(name, value) {
  return new Attribute(name, value);
}

function onClick(handler) {
  return new OnClick(handler);
}

function node(tag, attrs, children) {
  return new Element(tag, attrs, children);
}

class FakeTextNode {
  constructor(value) {
    this.nodeType = 3;
    this.parentNode = null;
    this.textContent = value;
  }
}

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.attributes = {};
    this.children = [];
    this.listeners = new Map();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.tagName = tagName.toUpperCase();
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      listeners.filter((candidate) => candidate !== listener)
    );
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
    if (name === "id") {
      this.ownerDocument.registerElement(value, this);
    }
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  set innerHTML(_value) {
    this.children = [];
  }

  get innerHTML() {
    return "";
  }
}

class FakeDocument {
  constructor(rootId) {
    this._elementsById = new Map();
    this._listeners = new Map();
    this.title = "";
    this.body = new FakeElement("body", this);
    const root = new FakeElement("div", this);
    root.setAttribute("id", rootId);
    this.body.appendChild(root);
  }

  registerElement(id, element) {
    this._elementsById.set(id, element);
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  createTextNode(value) {
    return new FakeTextNode(value);
  }

  getElementById(id) {
    return this._elementsById.get(id) ?? null;
  }

  addEventListener(type, listener) {
    const listeners = this._listeners.get(type) ?? [];
    listeners.push(listener);
    this._listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = this._listeners.get(type) ?? [];
    this._listeners.set(
      type,
      listeners.filter((candidate) => candidate !== listener)
    );
  }

  dispatchEvent(type, event) {
    const listeners = this._listeners.get(type) ?? [];
    for (const listener of listeners) {
      listener(event);
    }
  }
}

class FakeWindow {
  constructor() {
    this.location = {
      hash: "",
      pathname: "/",
      search: ""
    };
    this.listeners = new Map();
    this.history = {
      pushState: (_state, _title, href) => {
        this.setHref(href);
      },
      replaceState: (_state, _title, href) => {
        this.setHref(href);
      }
    };
  }

  setHref(href) {
    const url = new URL(href, "https://ps-spa.local");
    this.location.pathname = url.pathname;
    this.location.search = url.search;
    this.location.hash = url.hash;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      listeners.filter((candidate) => candidate !== listener)
    );
  }
}

function loadBrowserModule(document, window) {
  const module = { exports: {} };
  const context = vm.createContext({
    document,
    exports: module.exports,
    module,
    window
  });

  new vm.Script(browserSource, { filename: "Browser.js" }).runInContext(context);
  return module.exports;
}

function createEnvironment(rootId = "app") {
  const document = new FakeDocument(rootId);
  const window = new FakeWindow();
  return {
    browser: loadBrowserModule(document, window),
    document,
    rootId,
    window
  };
}

export function run(label, iterations, fn) {
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

export function buildPageDocument(options = {}) {
  const {
    buttonsPerCard = 2,
    cardsPerSection = 8,
    links = 10,
    route = "/",
    sections = 4,
    title = "Page"
  } = options;

  const navigationLinks = Array.from({ length: links }, (_, index) =>
    node(
      "a",
      [attr("href", `${route}nav-${index}`), attr("class", "nav-link"), onClick(() => {})],
      [text(`Link ${index + 1}`)]
    )
  );

  const sectionNodes = Array.from({ length: sections }, (_, sectionIndex) =>
    node("section", [attr("class", "section")], [
      node("h2", [attr("class", "section-title")], [text(`Section ${sectionIndex + 1}`)]),
      node(
        "div",
        [attr("class", "cards")],
        Array.from({ length: cardsPerSection }, (_, cardIndex) =>
          node("article", [attr("class", "card")], [
            node("h3", [], [text(`Card ${sectionIndex + 1}-${cardIndex + 1}`)]),
            node("p", [], [text(`Route ${route} card ${cardIndex + 1}`)]),
            node(
              "div",
              [attr("class", "actions")],
              Array.from({ length: buttonsPerCard }, (_, buttonIndex) =>
                node(
                  "button",
                  [attr("type", "button"), attr("data-action", `${sectionIndex}-${cardIndex}-${buttonIndex}`), onClick(() => {})],
                  [text(`Action ${buttonIndex + 1}`)]
                )
              )
            )
          ])
        )
      )
    ])
  );

  return {
    title,
    body: [
      node("main", [attr("class", "page-shell")], [
        node("header", [attr("class", "hero")], [
          node("h1", [attr("class", "title")], [text(title)]),
          node("p", [attr("class", "lede")], [text(`Framework runtime benchmark for ${route}`)]),
          node("nav", [attr("class", "nav")], navigationLinks)
        ]),
        ...sectionNodes
      ])
    ]
  };
}

export function runRenderBenchmark(label, iterations, documentFactory) {
  const env = createEnvironment();
  const render = env.browser.renderDocument;

  return run(label, iterations, () => {
    render({ document: documentFactory(), rootId: env.rootId })();
  });
}

export function runRerenderBenchmark(label, iterations, documentFactory) {
  const env = createEnvironment();
  const render = env.browser.renderDocument;

  return run(label, iterations, () => {
    render({ document: documentFactory(), rootId: env.rootId })();
    render({ document: documentFactory(), rootId: env.rootId })();
  });
}

export function runNavigationBenchmark(label, iterations, href) {
  const env = createEnvironment();
  const anchor = env.document.createElement("a");
  anchor.setAttribute("href", href);
  env.document.body.appendChild(anchor);

  let seenHref = null;
  const cleanup = env.browser.onInternalUrlRequest((nextHref) => () => {
    seenHref = nextHref;
  })();

  const scenario = run(label, iterations, () => {
    let prevented = false;
    env.document.dispatchEvent("click", {
      altKey: false,
      button: 0,
      ctrlKey: false,
      defaultPrevented: false,
      metaKey: false,
      preventDefault() {
        prevented = true;
        this.defaultPrevented = true;
      },
      shiftKey: false,
      target: anchor
    });

    if (!prevented || seenHref !== href) {
      throw new Error(`Navigation benchmark failed for ${href}`);
    }
  });

  cleanup();
  return scenario;
}
