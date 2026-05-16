// Pull common pieces out of a DOM Event without exposing the raw object to
// PureScript. Returns sensible defaults for events that don't carry the field.

export const targetValue = function (event) {
  if (event && event.target && typeof event.target.value === "string") {
    return event.target.value;
  }
  return "";
};

export const targetChecked = function (event) {
  return Boolean(event && event.target && event.target.checked);
};

export const keyName = function (event) {
  return event && typeof event.key === "string" ? event.key : "";
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
