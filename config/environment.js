function Environment(name) {
  this[name] = true;
  this.name = name;
  this.local = this.development || this.test;
}

Environment.prototype.toString = function() {
  return this.name;
}

module.exports = Environment;