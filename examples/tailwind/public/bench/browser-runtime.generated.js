export const renderDocument = function (config) {
  return function () {
    var root = document.getElementById(config.rootId) || document.body;

    if (!root) {
      return;
    }

    document.title = config.document.title;
    root.innerHTML = "";

    var renderNode = function (node) {
      if (node instanceof Object && node.constructor && node.constructor.name === "Text") {
        return document.createTextNode(node.value0);
      }

      if (node instanceof Object && node.constructor && node.constructor.name === "Element") {
        var element = document.createElement(node.value0);
        var attrs = node.value1;
        var children = node.value2;

        for (var i = 0; i < attrs.length; i += 1) {
          var attr = attrs[i];

          if (attr instanceof Object && attr.constructor && attr.constructor.name === "Attribute") {
            element.setAttribute(attr.value0, attr.value1);
          } else if (attr instanceof Object && attr.constructor && attr.constructor.name === "OnClick") {
            element.addEventListener(
              "click",
              (function (message) {
                return function (event) {
                  event.preventDefault();
                  message();
                };
              })(attr.value0)
            );
          }
        }

        for (var j = 0; j < children.length; j += 1) {
          element.appendChild(renderNode(children[j]));
        }

        return element;
      }

      return document.createTextNode("");
    };

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
