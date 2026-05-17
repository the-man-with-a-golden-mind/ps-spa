// PureScript ADT constructors compile to objects with stable `valueN` fields
// (part of the compiler's ABI). We dispatch on field presence rather than
// `constructor.name` so this code survives bundling/minification.
//
//   Html msg
//     = Text String                                          → { value0: str }
//     | Element String (Array (Attribute msg)) (Array Html)  → { value0, value1, value2 }
//     | Keyed { tag, attrs, children }                       → { value0: object }
//
//   Attribute msg
//     = Attribute String String                  → { value0: str, value1: str }
//     | OnClick (Effect Unit)                    → { value0: function }
//     | OnEvent String (Event -> Effect Unit)    → { value0: str, value1: function }
//
// Rendering does positional diffing in place rather than rebuilding the whole
// tree. Plain `Element` children are matched by index. `Keyed` children are
// matched by their string key across rerenders, so reordering preserves DOM
// identity (focus, scroll position, listener state) instead of being treated
// as a series of in-place mutations.

function isObject(value) {
  return value !== null && typeof value === "object";
}

function isTextHtml(node) {
  return isObject(node)
    && "value0" in node
    && !("value1" in node)
    && typeof node.value0 === "string";
}

function isKeyedHtml(node) {
  return isObject(node)
    && "value0" in node
    && !("value1" in node)
    && isObject(node.value0);
}

function isElementHtml(node) {
  return isObject(node) && "value2" in node;
}

function createNode(html) {
  if (!isObject(html)) return document.createTextNode("");
  if (isTextHtml(html)) return document.createTextNode(html.value0);
  if (isElementHtml(html)) {
    var element = document.createElement(html.value0);
    applyAttributes(element, [], html.value1);
    for (var i = 0; i < html.value2.length; i += 1) {
      element.appendChild(createNode(html.value2[i]));
    }
    return element;
  }
  if (isKeyedHtml(html)) {
    var record = html.value0;
    var keyedEl = document.createElement(record.tag);
    applyAttributes(keyedEl, [], record.attrs);
    var keyMap = {};
    for (var j = 0; j < record.children.length; j += 1) {
      var pair = record.children[j];
      var pairKey = pair.value0;
      // Duplicate keys are a user error; collapse to "last wins" to match the
      // re-render path's behaviour (where insertBefore detaches on collision).
      if (keyMap[pairKey] !== undefined) {
        keyedEl.removeChild(keyMap[pairKey]);
      }
      var childNode = createNode(pair.value1);
      keyedEl.appendChild(childNode);
      keyMap[pairKey] = childNode;
    }
    keyedEl._psSpaKeyMap = keyMap;
    return keyedEl;
  }
  return document.createTextNode("");
}

function reconcileChildren(parent, nextChildren) {
  var existing = [];
  for (var k = 0; k < parent.childNodes.length; k += 1) {
    existing.push(parent.childNodes[k]);
  }

  var max = existing.length > nextChildren.length ? existing.length : nextChildren.length;
  for (var i = 0; i < max; i += 1) {
    var domNode = existing[i];
    var nextHtml = nextChildren[i];

    if (nextHtml === undefined) {
      parent.removeChild(domNode);
    } else if (domNode === undefined) {
      parent.appendChild(createNode(nextHtml));
    } else {
      patchNode(parent, domNode, nextHtml);
    }
  }
}

function reconcileKeyedChildren(parent, nextPairs) {
  // Old key→DOM map from the previous render (may be undefined on the first
  // keyed render or after an Element→Keyed transition).
  var oldKeyMap = parent._psSpaKeyMap || {};
  var nextKeyMap = {};
  var nextKeySet = Object.create(null);

  for (var i = 0; i < nextPairs.length; i += 1) {
    nextKeySet[nextPairs[i].value0] = true;
  }

  // Detach old keyed nodes that aren't in the next render.
  for (var oldKey in oldKeyMap) {
    if (!nextKeySet[oldKey]) {
      var stale = oldKeyMap[oldKey];
      if (stale.parentNode === parent) {
        parent.removeChild(stale);
      }
    }
  }

  for (var j = 0; j < nextPairs.length; j += 1) {
    var pair = nextPairs[j];
    var key = pair.value0;
    var nextHtml = pair.value1;
    var existing = oldKeyMap[key];
    var resolved;

    if (existing && existing.parentNode === parent) {
      // Patch in place; patchNode may replace the node if the tag changed,
      // in which case it returns the freshly created replacement.
      resolved = patchNode(parent, existing, nextHtml) || existing;
    } else {
      resolved = createNode(nextHtml);
    }

    nextKeyMap[key] = resolved;

    var currentAtJ = parent.childNodes[j];
    if (currentAtJ !== resolved) {
      parent.insertBefore(resolved, currentAtJ || null);
    }
  }

  // Trim leftover non-keyed children (from an Element→Keyed transition).
  while (parent.childNodes.length > nextPairs.length) {
    parent.removeChild(parent.childNodes[parent.childNodes.length - 1]);
  }

  parent._psSpaKeyMap = nextKeyMap;
}

function patchNode(parent, domNode, nextHtml) {
  if (isTextHtml(nextHtml)) {
    if (domNode.nodeType === 3) {
      if (domNode.nodeValue !== nextHtml.value0) {
        domNode.nodeValue = nextHtml.value0;
      }
      return domNode;
    }
    var freshText = document.createTextNode(nextHtml.value0);
    parent.replaceChild(freshText, domNode);
    return freshText;
  }

  if (isKeyedHtml(nextHtml)) {
    var record = nextHtml.value0;
    if (domNode.nodeType !== 1 || domNode.nodeName.toLowerCase() !== record.tag.toLowerCase()) {
      var freshKeyed = createNode(nextHtml);
      parent.replaceChild(freshKeyed, domNode);
      return freshKeyed;
    }
    var previousAttrsKeyed = domNode._psSpaAttrs || [];
    applyAttributes(domNode, previousAttrsKeyed, record.attrs);
    reconcileKeyedChildren(domNode, record.children);
    return domNode;
  }

  if (!isElementHtml(nextHtml)) {
    var emptyText = document.createTextNode("");
    parent.replaceChild(emptyText, domNode);
    return emptyText;
  }

  var nextTag = nextHtml.value0;
  if (domNode.nodeType !== 1 || domNode.nodeName.toLowerCase() !== nextTag.toLowerCase()) {
    var freshEl = createNode(nextHtml);
    parent.replaceChild(freshEl, domNode);
    return freshEl;
  }

  // Same tag — diff attrs and children in place. Preserves input focus,
  // scroll position, video playback state, etc.
  var previousAttrs = domNode._psSpaAttrs || [];
  applyAttributes(domNode, previousAttrs, nextHtml.value1);
  // Switching from Keyed to plain Element on the same tag: drop the stale map.
  if (domNode._psSpaKeyMap) {
    domNode._psSpaKeyMap = null;
  }
  reconcileChildren(domNode, nextHtml.value2);
  return domNode;
}

function applyAttributes(element, previousAttrs, nextAttrs) {
  var previousListeners = element._psSpaListeners || {};
  var nextListeners = {};
  var previousAttrNames = {};
  var nextAttrNames = {};

  for (var p = 0; p < previousAttrs.length; p += 1) {
    var prev = previousAttrs[p];
    if (isObject(prev) && "value1" in prev && typeof prev.value1 !== "function") {
      previousAttrNames[prev.value0] = true;
    }
  }

  for (var i = 0; i < nextAttrs.length; i += 1) {
    var attr = nextAttrs[i];
    if (!isObject(attr)) continue;

    if ("value1" in attr && typeof attr.value1 === "function") {
      // OnEvent name handler
      var eventName = attr.value0;
      var handler = attr.value1;
      if (previousListeners[eventName]) {
        element.removeEventListener(eventName, previousListeners[eventName]);
      }
      var wrappedEv = (function (h) {
        return function (event) { h(event)(); };
      })(handler);
      element.addEventListener(eventName, wrappedEv);
      nextListeners[eventName] = wrappedEv;
    } else if ("value1" in attr) {
      // regular Attribute name value
      var attrName = attr.value0;
      nextAttrNames[attrName] = true;
      if (element.getAttribute(attrName) !== attr.value1) {
        element.setAttribute(attrName, attr.value1);
      }
    } else if ("value0" in attr) {
      // legacy OnClick — value0 is an Effect Unit thunk
      var message = attr.value0;
      if (previousListeners.click) {
        element.removeEventListener("click", previousListeners.click);
      }
      var wrappedClick = (function (m) {
        return function (event) {
          event.preventDefault();
          m();
        };
      })(message);
      element.addEventListener("click", wrappedClick);
      nextListeners.click = wrappedClick;
    }
  }

  for (var name in previousAttrNames) {
    if (!nextAttrNames[name]) {
      element.removeAttribute(name);
    }
  }

  for (var listenerName in previousListeners) {
    if (!nextListeners[listenerName]) {
      element.removeEventListener(listenerName, previousListeners[listenerName]);
    }
  }

  element._psSpaAttrs = nextAttrs;
  element._psSpaListeners = nextListeners;
}

export const renderDocument = function (config) {
  return function () {
    var root = document.getElementById(config.rootId) || document.body;

    if (!root) {
      return;
    }

    document.title = config.document.title;
    reconcileChildren(root, config.document.body);
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
