module.exports = function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function ($scope, $el, attr, ngModel) {
      $el.checkbox();

      // Render from the model to the UI
      ngModel.$render = function() {
        var checked = ngModel.$viewValue || false;
        $el.checkbox(checked ? 'check' : 'uncheck');
      };

      $el.click(function() {
        var checked = $el.checkbox('is checked');
        ngModel.$setViewValue(checked);
      });
    }
  };
}
