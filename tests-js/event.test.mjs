// Smoke tests for the FFI helpers in src/PsSpa/Event.js. They map raw DOM
// event fields into PureScript values, returning a zeroed default when the
// field doesn't apply — these tests pin both the happy path and the default.

import test from "node:test";
import assert from "node:assert/strict";

import * as Event from "../src/PsSpa/Event.js";

test("targetValue returns the input value string", () => {
  assert.equal(Event.targetValue({ target: { value: "hello" } }), "hello");
});

test("targetValue defaults to empty string when target has no string value", () => {
  assert.equal(Event.targetValue({}), "");
  assert.equal(Event.targetValue({ target: {} }), "");
  assert.equal(Event.targetValue({ target: { value: 42 } }), "");
  assert.equal(Event.targetValue(null), "");
});

test("targetChecked reflects target.checked as a Boolean", () => {
  assert.equal(Event.targetChecked({ target: { checked: true } }), true);
  assert.equal(Event.targetChecked({ target: { checked: false } }), false);
  assert.equal(Event.targetChecked({ target: {} }), false);
  assert.equal(Event.targetChecked({}), false);
  assert.equal(Event.targetChecked(null), false);
});

test("targetId reads target.id; defaults to empty", () => {
  assert.equal(Event.targetIdImpl({ target: { id: "username" } }), "username");
  assert.equal(Event.targetIdImpl({ target: {} }), "");
  assert.equal(Event.targetIdImpl({}), "");
});

test("keyName surfaces the event.key string", () => {
  assert.equal(Event.keyName({ key: "Enter" }), "Enter");
  assert.equal(Event.keyName({ key: "a" }), "a");
  assert.equal(Event.keyName({}), "");
  assert.equal(Event.keyName(null), "");
});

test("keyCode reflects numeric keyCode; 0 when missing", () => {
  assert.equal(Event.keyCodeImpl({ keyCode: 13 }), 13);
  assert.equal(Event.keyCodeImpl({}), 0);
  assert.equal(Event.keyCodeImpl(null), 0);
});

test("modifier flags reflect the matching event field", () => {
  const ev = { altKey: true, ctrlKey: false, shiftKey: true, metaKey: false };
  assert.equal(Event.altKey(ev), true);
  assert.equal(Event.ctrlKey(ev), false);
  assert.equal(Event.shiftKey(ev), true);
  assert.equal(Event.metaKey(ev), false);

  // Defaults when field is missing
  assert.equal(Event.altKey({}), false);
  assert.equal(Event.ctrlKey({}), false);
  assert.equal(Event.shiftKey({}), false);
  assert.equal(Event.metaKey({}), false);

  // Null event
  assert.equal(Event.altKey(null), false);
});

test("clientX/Y reflect numeric event fields", () => {
  const ev = { clientX: 120, clientY: 45 };
  assert.equal(Event.clientXImpl(ev), 120);
  assert.equal(Event.clientYImpl(ev), 45);
  assert.equal(Event.clientXImpl({}), 0);
  assert.equal(Event.clientYImpl({}), 0);
});

test("pageX/Y, screenX/Y reflect numeric event fields", () => {
  const ev = { pageX: 1, pageY: 2, screenX: 3, screenY: 4 };
  assert.equal(Event.pageXImpl(ev), 1);
  assert.equal(Event.pageYImpl(ev), 2);
  assert.equal(Event.screenXImpl(ev), 3);
  assert.equal(Event.screenYImpl(ev), 4);
  assert.equal(Event.pageXImpl({}), 0);
});

test("deltaX/Y reflect numeric event fields for wheel events", () => {
  assert.equal(Event.deltaXImpl({ deltaX: -10 }), -10);
  assert.equal(Event.deltaYImpl({ deltaY: 25 }), 25);
  assert.equal(Event.deltaXImpl({}), 0);
  assert.equal(Event.deltaYImpl({}), 0);
});

test("button reflects which mouse button was pressed (0=left, 1=middle, 2=right)", () => {
  assert.equal(Event.buttonImpl({ button: 0 }), 0);
  assert.equal(Event.buttonImpl({ button: 2 }), 2);
  assert.equal(Event.buttonImpl({}), 0);
});

test("preventDefault calls event.preventDefault when present", () => {
  let called = false;
  const event = { preventDefault: () => { called = true; } };
  Event.preventDefaultImpl(event)();
  assert.equal(called, true);
});

test("preventDefault is a no-op when the event lacks preventDefault", () => {
  // Should not throw
  Event.preventDefaultImpl({})();
  Event.preventDefaultImpl(null)();
});

test("stopPropagation calls event.stopPropagation when present", () => {
  let called = false;
  const event = { stopPropagation: () => { called = true; } };
  Event.stopPropagationImpl(event)();
  assert.equal(called, true);
});

test("stopPropagation is a no-op when the event lacks the method", () => {
  Event.stopPropagationImpl({})();
  Event.stopPropagationImpl(null)();
});
