// PureScript ADT constructors compile to objects with stable `valueN` fields
// (part of the compiler's ABI). We dispatch on field presence rather than
// `constructor.name` so this code survives bundling/minification.
//
//   Html msg
//     = Text String                                          → { value0 }
//     | Element String (Array (Attribute msg)) (Array Html)  → { value0, value1, value2 }
//
//   Attribute msg
//     = Attribute String String                  → { value0: str, value1: str }
//     | OnClick (Effect Unit)                    → { value0: function }
//     | OnEvent String (Event -> Effect Unit)    → { value0: str, value1: function }

function isObject(value) {
  return value !== null && typeof value === "object";
}

function renderNode(node) {
  if (!isObject(node)) {
    return document.createTextNode("");
  }

  if ("value2" in node) {
    // Element name attrs children
    var element = document.createElement(node.value0);
    var attrs = node.value1;
    var children = node.value2;

    for (var i = 0; i < attrs.length; i += 1) {
      applyAttribute(element, attrs[i]);
    }

    for (var j = 0; j < children.length; j += 1) {
      element.appendChild(renderNode(children[j]));
    }

    return element;
  }

  if ("value0" in node) {
    // Text value
    return document.createTextNode(node.value0);
  }

  return document.createTextNode("");
}

function applyAttribute(element, attr) {
  if (!isObject(attr)) return;

  if ("value1" in attr) {
    if (typeof attr.value1 === "function") {
      // OnEvent name handler (handler returns an Effect to dispatch the msg).
      var handler = attr.value1;
      element.addEventListener(attr.value0, function (event) {
        handler(event)();
      });
      return;
    }
    // Attribute name value
    element.setAttribute(attr.value0, attr.value1);
    return;
  }

  if ("value0" in attr) {
    // OnClick — value0 is a `Effect Unit` thunk after the runtime mapped
    // `OnClick msg → OnClick (Effect Unit)`.
    var message = attr.value0;
    element.addEventListener("click", function (event) {
      event.preventDefault();
      message();
    });
  }
}

export const renderDocument = function (config) {
  return function () {
    var root = document.getElementById(config.rootId) || document.body;

    if (!root) {
      return;
    }

    document.title = config.document.title;
    root.innerHTML = "";

    for (var i = 0; i < config.document.body.length; i += 1) {
      root.appendChild(renderNode(config.document.body[i]));
    }
  };
};

export const currentPath = function () {
  return window.location.pathname + window.location.search + window.location.hash;
};

export const pushUrl = function (url) {
  return function () {
    window.history.pushState({}, "", url);
  };
};

export const replaceUrl = function (url) {
  return function () {
    window.history.replaceState({}, "", url);
  };
};

export const onPopState = function (handler) {
  return function () {
    var listener = function () {
      handler();
    };

    window.addEventListener("popstate", listener);

    return function () {
      window.removeEventListener("popstate", listener);
    };
  };
};

export const onInternalUrlRequest = function (handler) {
  return function () {
    var listener = function (event) {
      if (event.defaultPrevented) {
        return;
      }

      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      var node = event.target;

      while (node && node !== document.body) {
        if (node.tagName === "A") {
          var href = node.getAttribute("href");

          if (!href || href.indexOf("http://") === 0 || href.indexOf("https://") === 0 || href.indexOf("mailto:") === 0) {
            return;
          }

          event.preventDefault();
          handler(href)();
          return;
        }

        node = node.parentNode;
      }
    };

    document.addEventListener("click", listener);

    return function () {
      document.removeEventListener("click", listener);
    };
  };
};
