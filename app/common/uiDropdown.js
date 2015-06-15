module.exports = function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function ($scope, $el, attr, ngModel) {
      // Start the dropdown
      $el.dropdown({
        onChange: function(value) {
          ngModel.$setViewValue(value);
        }
      });

      // Render from the model to the UI
      ngModel.$render = function() {
        $el.dropdown('set selected', ngModel.$viewValue);
      };
    }
  };
}
