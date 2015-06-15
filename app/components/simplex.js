var Simplex = require('../../src');

module.exports = function() {
  return {
    restrict: 'E',
    templateUrl: 'simplex.html',
    link: function ($scope, $el) {
      $scope.simplex = fromLocalStorage() || {type: 'max'};

      function fromLocalStorage() {
        var value = localStorage.simplex;
        if (value) return JSON.parse(value);
      }

      function toLocalStorage(simplex) {
        localStorage.simplex = JSON.stringify(simplex);
      }
      $scope.$watch('simplex', toLocalStorage, true);

      $scope.solve = function() {
        var equation = $scope.simplex.equation;
        var constraints = $scope.simplex.constraints.split('\n');
        $scope.result = Simplex.maximize(equation, constraints);
        $scope.result.values = _.omit($scope.result, 'tableaus');
      }
    }
  };
}
