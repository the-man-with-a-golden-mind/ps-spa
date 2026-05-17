// Exercises the Browser.js renderer's positional diffing through the
// fake-DOM harness used by the benchmarks. Each test renders an initial
// tree, mutates the model, rerenders, and asserts that the resulting DOM
// reuses nodes where possible instead of being rebuilt from scratch.

import test from "node:test";
import assert from "node:assert/strict";

import {
  attr,
  createEnvironment,
  keyed,
  node,
  onClick,
  onEvent,
  text
} from "../benchmarks/runtime-harness.mjs";

function render(env, doc) {
  env.browser.renderDocument({ rootId: env.rootId, document: doc })();
}

function rootChildren(env) {
  return env.document.getElementById(env.rootId).childNodes;
}

test("first render builds the tree under the root", () => {
  const env = createEnvironment();
  render(env, {
    title: "hello",
    body: [ node("div", [ attr("class", "outer") ], [ text("hi") ]) ]
  });

  const children = rootChildren(env);
  assert.equal(children.length, 1);
  assert.equal(children[0].tagName, "DIV");
  assert.equal(children[0].getAttribute("class"), "outer");
  assert.equal(children[0].childNodes.length, 1);
  assert.equal(children[0].childNodes[0].nodeValue, "hi");
  assert.equal(env.document.title, "hello");
});

test("identical rerender reuses the same DOM nodes", () => {
  const env = createEnvironment();
  const doc = {
    title: "stable",
    body: [ node("div", [ attr("class", "card") ], [ text("body") ]) ]
  };

  render(env, doc);
  const first = rootChildren(env)[0];

  render(env, doc);
  const second = rootChildren(env)[0];

  assert.strictEqual(first, second, "diffing should reuse the existing element");
});

test("text content updates in place without replacing the element", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("p", [], [ text("first") ]) ]
  });
  const p1 = rootChildren(env)[0];
  const textNode1 = p1.childNodes[0];

  render(env, {
    title: "",
    body: [ node("p", [], [ text("second") ]) ]
  });
  const p2 = rootChildren(env)[0];

  assert.strictEqual(p1, p2, "<p> element should be reused");
  assert.strictEqual(textNode1, p2.childNodes[0], "text node should be reused");
  assert.equal(textNode1.nodeValue, "second");
});

test("changing class updates the attribute in place", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("button", [ attr("class", "btn") ], [ text("Go") ]) ]
  });
  const before = rootChildren(env)[0];

  render(env, {
    title: "",
    body: [ node("button", [ attr("class", "btn primary") ], [ text("Go") ]) ]
  });
  const after = rootChildren(env)[0];

  assert.strictEqual(before, after);
  assert.equal(after.getAttribute("class"), "btn primary");
});

test("removing an attribute on rerender drops it from the DOM", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("input", [ attr("disabled", "disabled"), attr("type", "text") ], []) ]
  });
  const el = rootChildren(env)[0];
  assert.equal(el.getAttribute("disabled"), "disabled");

  render(env, {
    title: "",
    body: [ node("input", [ attr("type", "text") ], []) ]
  });

  assert.strictEqual(rootChildren(env)[0], el);
  assert.equal(el.getAttribute("disabled"), null);
  assert.equal(el.getAttribute("type"), "text");
});

test("changing the tag replaces the subtree", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("div", [], [ text("a") ]) ]
  });
  const div = rootChildren(env)[0];

  render(env, {
    title: "",
    body: [ node("section", [], [ text("a") ]) ]
  });
  const section = rootChildren(env)[0];

  assert.notStrictEqual(div, section);
  assert.equal(section.tagName, "SECTION");
});

test("appending a child does not rebuild siblings", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("ul", [], [
      node("li", [], [ text("one") ]),
      node("li", [], [ text("two") ])
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const liOne = ul.childNodes[0];
  const liTwo = ul.childNodes[1];

  render(env, {
    title: "",
    body: [ node("ul", [], [
      node("li", [], [ text("one") ]),
      node("li", [], [ text("two") ]),
      node("li", [], [ text("three") ])
    ]) ]
  });

  assert.strictEqual(ul.childNodes[0], liOne, "first item reused");
  assert.strictEqual(ul.childNodes[1], liTwo, "second item reused");
  assert.equal(ul.childNodes.length, 3);
  assert.equal(ul.childNodes[2].childNodes[0].nodeValue, "three");
});

test("removing a child drops only the tail", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("ul", [], [
      node("li", [], [ text("one") ]),
      node("li", [], [ text("two") ]),
      node("li", [], [ text("three") ])
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const liOne = ul.childNodes[0];

  render(env, {
    title: "",
    body: [ node("ul", [], [
      node("li", [], [ text("one") ])
    ]) ]
  });

  assert.equal(ul.childNodes.length, 1);
  assert.strictEqual(ul.childNodes[0], liOne, "remaining item is reused");
});

test("event handlers are swapped on rerender without leaking the old one", () => {
  const env = createEnvironment();
  let fires = [];

  render(env, {
    title: "",
    body: [ node("button", [ onClick(() => { fires.push("first"); }) ], [ text("Click") ]) ]
  });
  const button = rootChildren(env)[0];

  // Replace the click handler.
  render(env, {
    title: "",
    body: [ node("button", [ onClick(() => { fires.push("second"); }) ], [ text("Click") ]) ]
  });

  // Dispatch a click directly through the fake listener registry.
  const listeners = button.listeners.get("click") ?? [];
  assert.equal(listeners.length, 1, "old listener was removed; only the new one remains");
  listeners[0]({ preventDefault: () => {} });
  assert.deepEqual(fires, [ "second" ]);
});

test("OnEvent handler removed when the attribute is no longer present", () => {
  const env = createEnvironment();
  let fires = 0;

  render(env, {
    title: "",
    body: [ node("input", [ onEvent("input", (_e) => () => { fires += 1; }) ], []) ]
  });
  const input = rootChildren(env)[0];
  assert.equal((input.listeners.get("input") ?? []).length, 1);

  render(env, {
    title: "",
    body: [ node("input", [], []) ]
  });
  assert.equal((input.listeners.get("input") ?? []).length, 0, "input listener cleared");
});

test("OnEvent passes the synthetic event to the handler", () => {
  const env = createEnvironment();
  let captured = null;

  render(env, {
    title: "",
    body: [ node("input", [ onEvent("input", (e) => () => { captured = e; }) ], []) ]
  });
  const input = rootChildren(env)[0];
  const listeners = input.listeners.get("input") ?? [];
  assert.equal(listeners.length, 1);

  const fakeEvent = { target: { value: "hello" } };
  listeners[0](fakeEvent);
  assert.strictEqual(captured, fakeEvent);
});

test("legacy OnClick handler is fully removed when the attribute is dropped", () => {
  const env = createEnvironment();
  let fires = 0;

  render(env, {
    title: "",
    body: [ node("button", [ onClick(() => { fires += 1; }) ], [ text("Go") ]) ]
  });
  const button = rootChildren(env)[0];
  assert.equal((button.listeners.get("click") ?? []).length, 1);

  render(env, {
    title: "",
    body: [ node("button", [], [ text("Go") ]) ]
  });

  assert.equal((button.listeners.get("click") ?? []).length, 0, "click listener cleared");
});

test("OnEvent listener is replaced (not added) when the handler changes", () => {
  const env = createEnvironment();
  let trail = [];

  const firstHandler = (_e) => () => { trail.push("first"); };
  render(env, {
    title: "",
    body: [ node("input", [ onEvent("input", firstHandler) ], []) ]
  });
  const input = rootChildren(env)[0];
  assert.equal((input.listeners.get("input") ?? []).length, 1, "one listener after first render");

  const secondHandler = (_e) => () => { trail.push("second"); };
  render(env, {
    title: "",
    body: [ node("input", [ onEvent("input", secondHandler) ], []) ]
  });

  const listeners = input.listeners.get("input") ?? [];
  assert.equal(listeners.length, 1, "still only one listener after swap");
  listeners[0]({});
  assert.deepEqual(trail, [ "second" ], "only the new handler fires");
});

test("boolean attribute true → false removes the attribute", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("button", [ attr("disabled", "disabled"), attr("type", "submit") ], [ text("Save") ]) ]
  });
  const button = rootChildren(env)[0];
  assert.equal(button.getAttribute("disabled"), "disabled");

  // Same element, but no disabled attribute this time.
  render(env, {
    title: "",
    body: [ node("button", [ attr("type", "submit") ], [ text("Save") ]) ]
  });
  assert.strictEqual(rootChildren(env)[0], button, "button reused");
  assert.equal(button.getAttribute("disabled"), null);
  assert.equal(button.getAttribute("type"), "submit");
});

test("attribute added on rerender shows up without rebuilding", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("div", [], [ text("body") ]) ]
  });
  const div = rootChildren(env)[0];

  render(env, {
    title: "",
    body: [ node("div", [ attr("data-state", "open"), attr("id", "panel") ], [ text("body") ]) ]
  });

  assert.strictEqual(rootChildren(env)[0], div);
  assert.equal(div.getAttribute("data-state"), "open");
  assert.equal(div.getAttribute("id"), "panel");
});

test("mixing OnClick and OnEvent on the same element registers both", () => {
  const env = createEnvironment();
  let order = [];

  render(env, {
    title: "",
    body: [ node("button",
      [ onClick(() => { order.push("legacy"); })
      , onEvent("mouseenter", (_e) => () => { order.push("enter"); })
      ],
      [ text("Hover & Click") ]
    ) ]
  });
  const button = rootChildren(env)[0];

  assert.equal((button.listeners.get("click") ?? []).length, 1);
  assert.equal((button.listeners.get("mouseenter") ?? []).length, 1);

  (button.listeners.get("mouseenter") ?? [])[0]({});
  (button.listeners.get("click") ?? [])[0]({ preventDefault: () => {} });
  assert.deepEqual(order, [ "enter", "legacy" ]);
});

test("rerendering from text-only body to element body replaces the node", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ text("plain") ]
  });
  const initial = rootChildren(env)[0];
  assert.equal(initial.nodeType, 3, "first render produced a text node");

  render(env, {
    title: "",
    body: [ node("p", [], [ text("now wrapped") ]) ]
  });

  const next = rootChildren(env)[0];
  assert.equal(next.nodeType, 1);
  assert.equal(next.tagName, "P");
  assert.notStrictEqual(next, initial);
});

test("body shrinking to empty removes all children", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("p", [], [ text("a") ]), node("p", [], [ text("b") ]) ]
  });
  assert.equal(rootChildren(env).length, 2);

  render(env, { title: "", body: [] });
  assert.equal(rootChildren(env).length, 0);
});

test("body growing from empty appends the new tree", () => {
  const env = createEnvironment();
  render(env, { title: "", body: [] });
  assert.equal(rootChildren(env).length, 0);

  render(env, {
    title: "",
    body: [ node("h1", [], [ text("Hello") ]) ]
  });
  assert.equal(rootChildren(env).length, 1);
  assert.equal(rootChildren(env)[0].tagName, "H1");
});

test("inserting a child in the middle still produces the right ordering (positional diff is naive)", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("ul", [], [
      node("li", [], [ text("a") ]),
      node("li", [], [ text("c") ])
    ]) ]
  });
  const ul = rootChildren(env)[0];

  // Insert "b" between "a" and "c". Without keys, the diff matches by index:
  // li[0]: a → a (same)
  // li[1]: c → b (text updated in place)
  // li[2]: ∅ → c (appended)
  render(env, {
    title: "",
    body: [ node("ul", [], [
      node("li", [], [ text("a") ]),
      node("li", [], [ text("b") ]),
      node("li", [], [ text("c") ])
    ]) ]
  });

  assert.equal(ul.childNodes.length, 3);
  assert.equal(ul.childNodes[0].childNodes[0].nodeValue, "a");
  assert.equal(ul.childNodes[1].childNodes[0].nodeValue, "b");
  assert.equal(ul.childNodes[2].childNodes[0].nodeValue, "c");
});

test("keyed first render builds children in the given order", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [ attr("class", "list") ], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ],
      [ "c", node("li", [], [ text("C") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  assert.equal(ul.tagName, "UL");
  assert.equal(ul.getAttribute("class"), "list");
  assert.equal(ul.childNodes.length, 3);
  assert.equal(ul.childNodes[0].childNodes[0].nodeValue, "A");
  assert.equal(ul.childNodes[1].childNodes[0].nodeValue, "B");
  assert.equal(ul.childNodes[2].childNodes[0].nodeValue, "C");
});

test("keyed reorder preserves DOM identity of each child", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ],
      [ "c", node("li", [], [ text("C") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const liA = ul.childNodes[0];
  const liB = ul.childNodes[1];
  const liC = ul.childNodes[2];

  // Reverse the order. Positional diff would mutate text in place; keyed diff
  // should move the existing nodes.
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "c", node("li", [], [ text("C") ]) ],
      [ "b", node("li", [], [ text("B") ]) ],
      [ "a", node("li", [], [ text("A") ]) ]
    ]) ]
  });

  assert.equal(ul.childNodes.length, 3);
  assert.strictEqual(ul.childNodes[0], liC, "C moved to head, same node");
  assert.strictEqual(ul.childNodes[1], liB, "B stays, same node");
  assert.strictEqual(ul.childNodes[2], liA, "A moved to tail, same node");
});

test("keyed insert at head reuses every old child", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "b", node("li", [], [ text("B") ]) ],
      [ "c", node("li", [], [ text("C") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const liB = ul.childNodes[0];
  const liC = ul.childNodes[1];

  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ],
      [ "c", node("li", [], [ text("C") ]) ]
    ]) ]
  });

  assert.equal(ul.childNodes.length, 3);
  assert.equal(ul.childNodes[0].childNodes[0].nodeValue, "A");
  assert.strictEqual(ul.childNodes[1], liB, "B reused");
  assert.strictEqual(ul.childNodes[2], liC, "C reused");
});

test("keyed insert in the middle preserves identity of surrounding children", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "c", node("li", [], [ text("C") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const liA = ul.childNodes[0];
  const liC = ul.childNodes[1];

  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ],
      [ "c", node("li", [], [ text("C") ]) ]
    ]) ]
  });

  assert.equal(ul.childNodes.length, 3);
  assert.strictEqual(ul.childNodes[0], liA, "A reused");
  assert.equal(ul.childNodes[1].childNodes[0].nodeValue, "B");
  assert.strictEqual(ul.childNodes[2], liC, "C reused (not mutated in place)");
});

test("keyed remove from the middle keeps survivors intact", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ],
      [ "c", node("li", [], [ text("C") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const liA = ul.childNodes[0];
  const liC = ul.childNodes[2];

  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "c", node("li", [], [ text("C") ]) ]
    ]) ]
  });

  assert.equal(ul.childNodes.length, 2);
  assert.strictEqual(ul.childNodes[0], liA, "A reused");
  assert.strictEqual(ul.childNodes[1], liC, "C reused (the removal targeted B, not C)");
});

test("keyed event listeners follow the node across reorders", () => {
  const env = createEnvironment();
  const fires = [];

  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [ onClick(() => { fires.push("A"); }) ], [ text("A") ]) ],
      [ "b", node("li", [ onClick(() => { fires.push("B"); }) ], [ text("B") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const liA = ul.childNodes[0];

  // Reorder and re-bind the handler for "a" with the SAME closure semantics.
  // The runtime should swap listeners on the moved node, not on whatever
  // happens to share the new index.
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "b", node("li", [ onClick(() => { fires.push("B2"); }) ], [ text("B") ]) ],
      [ "a", node("li", [ onClick(() => { fires.push("A2"); }) ], [ text("A") ]) ]
    ]) ]
  });

  assert.strictEqual(ul.childNodes[1], liA, "A is now at index 1, same node");
  const aListeners = liA.listeners.get("click") ?? [];
  assert.equal(aListeners.length, 1, "exactly one click listener on A");
  aListeners[0]({ preventDefault: () => {} });
  assert.deepEqual(fires, [ "A2" ], "A's new handler fires; not B's");
});

test("keyed mixed add + remove + reorder", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ],
      [ "c", node("li", [], [ text("C") ]) ],
      [ "d", node("li", [], [ text("D") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const liA = ul.childNodes[0];
  const liC = ul.childNodes[2];
  const liD = ul.childNodes[3];

  // Remove B, swap C↔D, insert E at head.
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "e", node("li", [], [ text("E") ]) ],
      [ "a", node("li", [], [ text("A") ]) ],
      [ "d", node("li", [], [ text("D") ]) ],
      [ "c", node("li", [], [ text("C") ]) ]
    ]) ]
  });

  assert.equal(ul.childNodes.length, 4);
  assert.equal(ul.childNodes[0].childNodes[0].nodeValue, "E");
  assert.strictEqual(ul.childNodes[1], liA, "A survived");
  assert.strictEqual(ul.childNodes[2], liD, "D moved up");
  assert.strictEqual(ul.childNodes[3], liC, "C moved down");
});

test("keyed → keyed with all keys replaced reuses no children", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const oldLi = ul.childNodes[0];

  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "z", node("li", [], [ text("Z") ]) ]
    ]) ]
  });

  assert.equal(ul.childNodes.length, 1);
  assert.notStrictEqual(ul.childNodes[0], oldLi, "different key = fresh node");
  assert.equal(ul.childNodes[0].childNodes[0].nodeValue, "Z");
});

test("Element → Keyed transition cleans up stale children", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("ul", [], [
      node("li", [], [ text("X") ]),
      node("li", [], [ text("Y") ])
    ]) ]
  });
  const ul = rootChildren(env)[0];

  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ]
    ]) ]
  });

  assert.strictEqual(rootChildren(env)[0], ul, "<ul> reused (same tag)");
  assert.equal(ul.childNodes.length, 2);
  assert.equal(ul.childNodes[0].childNodes[0].nodeValue, "A");
  assert.equal(ul.childNodes[1].childNodes[0].nodeValue, "B");
});

test("Keyed → Element transition drops the key map and falls back to positional diff", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];

  render(env, {
    title: "",
    body: [ node("ul", [], [
      node("li", [], [ text("X") ])
    ]) ]
  });

  assert.strictEqual(rootChildren(env)[0], ul, "<ul> reused (same tag)");
  assert.equal(ul.childNodes.length, 1);
  assert.equal(ul.childNodes[0].childNodes[0].nodeValue, "X");
  assert.equal(ul._psSpaKeyMap, null, "stale key map cleared");
});

test("keyed identical rerender does no DOM work", () => {
  const env = createEnvironment();
  const doc = {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ]
    ]) ]
  };

  render(env, doc);
  const ul = rootChildren(env)[0];
  const liA = ul.childNodes[0];
  const liB = ul.childNodes[1];

  render(env, doc);

  assert.strictEqual(rootChildren(env)[0], ul);
  assert.strictEqual(ul.childNodes[0], liA);
  assert.strictEqual(ul.childNodes[1], liB);
});

test("nested keyed inside keyed preserves identity at both levels across reorders", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("section", [], [
      [ "group-1", keyed("ul", [], [
          [ "a", node("li", [], [ text("A1") ]) ],
          [ "b", node("li", [], [ text("B1") ]) ]
        ]) ],
        [ "group-2", keyed("ul", [], [
          [ "a", node("li", [], [ text("A2") ]) ],
          [ "b", node("li", [], [ text("B2") ]) ]
        ]) ]
    ]) ]
  });
  const section = rootChildren(env)[0];
  const ulOne = section.childNodes[0];
  const ulTwo = section.childNodes[1];
  const ulOneLiA = ulOne.childNodes[0];
  const ulTwoLiB = ulTwo.childNodes[1];

  // Reverse outer order, AND reverse inner order of group-1.
  render(env, {
    title: "",
    body: [ keyed("section", [], [
      [ "group-2", keyed("ul", [], [
          [ "a", node("li", [], [ text("A2") ]) ],
          [ "b", node("li", [], [ text("B2") ]) ]
        ]) ],
      [ "group-1", keyed("ul", [], [
          [ "b", node("li", [], [ text("B1") ]) ],
          [ "a", node("li", [], [ text("A1") ]) ]
        ]) ]
    ]) ]
  });

  assert.strictEqual(section.childNodes[0], ulTwo, "outer: group-2 moved up, same <ul>");
  assert.strictEqual(section.childNodes[1], ulOne, "outer: group-1 moved down, same <ul>");
  assert.strictEqual(section.childNodes[1].childNodes[0], ulOne.childNodes[0], "inner: same node at new position");
  assert.strictEqual(section.childNodes[1].childNodes[1], ulOneLiA, "inner: A1 moved to end, same node");
  assert.strictEqual(section.childNodes[0].childNodes[1], ulTwoLiB, "inner of group-2: untouched, B2 still there");
});

test("keyed empty → non-empty via rerender uses patchNode (not createNode) path", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [ attr("class", "list") ], []) ]
  });
  const ul = rootChildren(env)[0];
  assert.equal(ul.childNodes.length, 0);

  render(env, {
    title: "",
    body: [ keyed("ul", [ attr("class", "list") ], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ]
    ]) ]
  });

  assert.strictEqual(rootChildren(env)[0], ul, "<ul> reused");
  assert.equal(ul.childNodes.length, 2);
  assert.equal(ul.childNodes[0].childNodes[0].nodeValue, "A");
  assert.equal(ul.childNodes[1].childNodes[0].nodeValue, "B");
});

test("keyed non-empty → empty removes every child", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ],
      [ "c", node("li", [], [ text("C") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];

  render(env, {
    title: "",
    body: [ keyed("ul", [], []) ]
  });

  assert.strictEqual(rootChildren(env)[0], ul, "<ul> reused");
  assert.equal(ul.childNodes.length, 0, "all children removed");
});

test("keyed container attributes diff in place across rerenders", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [ attr("class", "compact"), attr("data-state", "loading") ], [
      [ "a", node("li", [], [ text("A") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const liA = ul.childNodes[0];
  assert.equal(ul.getAttribute("class"), "compact");
  assert.equal(ul.getAttribute("data-state"), "loading");

  render(env, {
    title: "",
    body: [ keyed("ul", [ attr("class", "wide") ], [
      [ "a", node("li", [], [ text("A") ]) ]
    ]) ]
  });

  assert.strictEqual(rootChildren(env)[0], ul, "<ul> reused");
  assert.strictEqual(ul.childNodes[0], liA, "child reused");
  assert.equal(ul.getAttribute("class"), "wide", "class updated in place");
  assert.equal(ul.getAttribute("data-state"), null, "data-state removed");
});

test("keyed child whose tag changes is replaced; key still tracks the new node", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("li", [], [ text("A") ]) ],
      [ "b", node("li", [], [ text("B") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  const oldLiA = ul.childNodes[0];
  const liB = ul.childNodes[1];

  // Same key "a", but tag flips from <li> to <div>.
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "a", node("div", [ attr("class", "card") ], [ text("A!") ]) ],
      [ "b", node("li", [], [ text("B") ]) ]
    ]) ]
  });

  assert.equal(ul.childNodes.length, 2);
  assert.notStrictEqual(ul.childNodes[0], oldLiA, "old <li> replaced");
  assert.equal(ul.childNodes[0].tagName, "DIV");
  assert.equal(ul.childNodes[0].getAttribute("class"), "card");
  assert.strictEqual(ul.childNodes[1], liB, "neighbour with stable key+tag stays put");

  // The next reorder should still treat key "a" as the new <div>, not the dead <li>.
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "b", node("li", [], [ text("B") ]) ],
      [ "a", node("div", [ attr("class", "card") ], [ text("A!") ]) ]
    ]) ]
  });
  assert.strictEqual(ul.childNodes[0], liB, "B moved up, same node");
  assert.equal(ul.childNodes[1].tagName, "DIV", "A's new <div> moved down");
});

test("keyed Text child is fine alongside element children", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("div", [], [
      [ "label", text("Total:") ],
      [ "value", node("strong", [], [ text("42") ]) ]
    ]) ]
  });
  const wrapper = rootChildren(env)[0];
  const labelNode = wrapper.childNodes[0];
  const valueNode = wrapper.childNodes[1];
  assert.equal(labelNode.nodeType, 3, "first child is a text node");
  assert.equal(labelNode.nodeValue, "Total:");
  assert.equal(valueNode.tagName, "STRONG");

  // Update the value, leave the text label alone. Both should be reused.
  render(env, {
    title: "",
    body: [ keyed("div", [], [
      [ "label", text("Total:") ],
      [ "value", node("strong", [], [ text("43") ]) ]
    ]) ]
  });

  assert.strictEqual(wrapper.childNodes[0], labelNode, "text node reused");
  assert.strictEqual(wrapper.childNodes[1], valueNode, "<strong> reused");
  assert.equal(valueNode.childNodes[0].nodeValue, "43");
});

test("keyed duplicate keys collapse onto a single DOM node (documents the behaviour)", () => {
  // The renderer treats keys as identifiers; duplicates within one container
  // are a user error. This test pins down the current behaviour so we know
  // when it changes (e.g. if we ever start throwing on collisions).
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ keyed("ul", [], [
      [ "x", node("li", [], [ text("first") ]) ],
      [ "x", node("li", [], [ text("second") ]) ]
    ]) ]
  });
  const ul = rootChildren(env)[0];
  // The second occurrence "wins" placement at index 0 because insertBefore
  // detaches the node from its prior position. Only one DOM node survives.
  assert.equal(ul.childNodes.length, 1, "duplicate keys collapse to one node");
});

test("nested edits preserve identity at every level that doesn't change shape", () => {
  const env = createEnvironment();
  render(env, {
    title: "",
    body: [ node("main", [ attr("class", "page") ], [
      node("section", [], [
        node("h1", [], [ text("Hello") ]),
        node("p", [], [ text("intro") ])
      ])
    ]) ]
  });
  const root = env.document.getElementById(env.rootId);
  const main = root.childNodes[0];
  const section = main.childNodes[0];
  const h1 = section.childNodes[0];
  const p = section.childNodes[1];

  render(env, {
    title: "",
    body: [ node("main", [ attr("class", "page") ], [
      node("section", [], [
        node("h1", [], [ text("Hello, world") ]),
        node("p", [], [ text("intro") ])
      ])
    ]) ]
  });

  assert.strictEqual(root.childNodes[0], main, "main reused");
  assert.strictEqual(main.childNodes[0], section, "section reused");
  assert.strictEqual(section.childNodes[0], h1, "h1 reused");
  assert.strictEqual(section.childNodes[1], p, "p reused");
  assert.equal(h1.childNodes[0].nodeValue, "Hello, world");
});
