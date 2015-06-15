module.exports = function(app) {
  app.directive({
    simplex: require('./simplex')
  });
}
