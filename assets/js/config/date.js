Date.fromJSON = function(date) {
  if (!date) return null;
  if (date instanceof Date) return date;
  return moment.parseZone(date).toDate();
}

Date.prototype.format = function(format) {
  return moment(this).format(format);
}

Date.prototype.formatUtc = function(format) {
  return moment.utc(this).format(format);
}

Date.prototype.fromNow = function() {
  return moment(this).fromNow();
}
