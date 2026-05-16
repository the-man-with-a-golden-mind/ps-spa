// PureScript records compile to plain JS objects; reach in by field name.
export const unsafeGetField = function (name) {
  return function (record) {
    return record[name];
  };
};
