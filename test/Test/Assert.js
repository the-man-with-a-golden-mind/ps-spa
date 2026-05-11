exports.failTest = (message) => () => {
  throw new Error(message);
};
