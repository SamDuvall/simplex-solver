module.exports = function() {
  return {
    restrict: 'A',
    link: function ($scope, $el) {
      $el.popup();
    }
  };
}
