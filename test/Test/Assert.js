export const failTest = (message) => () => {
  throw new Error(message);
};
