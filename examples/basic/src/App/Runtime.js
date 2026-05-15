var listeners = new Set();

export const emitNotice = function (notice) {
  return function () {
    listeners.forEach(function (listener) {
      listener(notice)();
    });
  };
};

export const every = function (milliseconds) {
  return function (effect) {
    return function () {
      var id = window.setInterval(function () {
        effect();
      }, milliseconds);

      return function () {
        window.clearInterval(id);
      };
    };
  };
};

export const subscribeNotice = function (handler) {
  return function () {
    listeners.add(handler);

    return function () {
      listeners.delete(handler);
    };
  };
};
