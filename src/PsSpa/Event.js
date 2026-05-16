// Pull common pieces out of a DOM Event without exposing the raw object to
// PureScript. Each helper returns a sensible default when the field isn't
// applicable to the event type, so the FFI surface stays total.

export const targetValue = function (event) {
  if (event && event.target && typeof event.target.value === "string") {
    return event.target.value;
  }
  return "";
};

export const targetChecked = function (event) {
  return Boolean(event && event.target && event.target.checked);
};

export const targetIdImpl = function (event) {
  if (event && event.target && typeof event.target.id === "string") {
    return event.target.id;
  }
  return "";
};

export const keyName = function (event) {
  return event && typeof event.key === "string" ? event.key : "";
};

export const keyCodeImpl = function (event) {
  return event && typeof event.keyCode === "number" ? event.keyCode : 0;
};

// Mouse / pointer / touch geometry. Returns 0 if the event doesn't carry the field.
export const clientXImpl = function (event) {
  return event && typeof event.clientX === "number" ? event.clientX : 0;
};
export const clientYImpl = function (event) {
  return event && typeof event.clientY === "number" ? event.clientY : 0;
};
export const pageXImpl = function (event) {
  return event && typeof event.pageX === "number" ? event.pageX : 0;
};
export const pageYImpl = function (event) {
  return event && typeof event.pageY === "number" ? event.pageY : 0;
};
export const screenXImpl = function (event) {
  return event && typeof event.screenX === "number" ? event.screenX : 0;
};
export const screenYImpl = function (event) {
  return event && typeof event.screenY === "number" ? event.screenY : 0;
};
export const deltaXImpl = function (event) {
  return event && typeof event.deltaX === "number" ? event.deltaX : 0;
};
export const deltaYImpl = function (event) {
  return event && typeof event.deltaY === "number" ? event.deltaY : 0;
};
export const buttonImpl = function (event) {
  return event && typeof event.button === "number" ? event.button : 0;
};

// Keyboard / mouse modifiers
export const altKey = function (event) {
  return Boolean(event && event.altKey);
};
export const ctrlKey = function (event) {
  return Boolean(event && event.ctrlKey);
};
export const shiftKey = function (event) {
  return Boolean(event && event.shiftKey);
};
export const metaKey = function (event) {
  return Boolean(event && event.metaKey);
};

export const preventDefaultImpl = function (event) {
  return function () {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
  };
};

export const stopPropagationImpl = function (event) {
  return function () {
    if (event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
  };
};
