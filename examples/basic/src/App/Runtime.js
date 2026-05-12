"use strict";

var listeners = new Set();

exports.emitNotice = function (notice) {
  return function () {
    listeners.forEach(function (listener) {
      listener(notice)();
    });
  };
};

exports.every = function (milliseconds) {
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

exports.subscribeNotice = function (handler) {
  return function () {
    listeners.add(handler);

    return function () {
      listeners.delete(handler);
    };
  };
};
