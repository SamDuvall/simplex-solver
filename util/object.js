var _ = require('underscore');

function merge(base, override) {
  var result = {};

  var keys = _.union(_.keys(base), _.keys(override));
  _.each(keys, function(key) {
    var baseVal = base[key];
    var overrideVal = override[key];
    if (_.isObject(baseVal) && _.isObject(overrideVal)) {
      result[key] = merge(baseVal, overrideVal);
    } else if (!overrideVal) {
      result[key] = baseVal;
    } else {
      result[key] = overrideVal;
    }
  });

  return result;
}

module.exports = {
  merge: merge
}
