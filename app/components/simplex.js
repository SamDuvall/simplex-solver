var Simplex = require('../../src');

module.exports = function() {
  return {
    restrict: 'E',
    templateUrl: 'simplex.html',
    link: function ($scope, $el) {
      $scope.simplex = fromLocalStorage() || {type: 'max', equation: '', constraints: ''};

      function fromLocalStorage() {
        var value = localStorage.simplex;
        if (value) return JSON.parse(value);
      }

      function toLocalStorage(simplex) {
        localStorage.simplex = JSON.stringify(simplex);
      }
      $scope.$watch('simplex', toLocalStorage, true);

      function clearResult() {
        $scope.result = null;
      }
      $scope.$watch('simplex', clearResult, true);

      $scope.isValid = function() {
        var simplex = $scope.simplex;
        return simplex.equation.length && simplex.constraints.length;
      }

      $scope.clear = function() {
        $scope.simplex.equation = '';
        $scope.simplex.constraints = '';
      }

      $scope.example = function() {
        $scope.simplex.equation = 'x + y + 2z';
        $scope.simplex.constraints = [
          '2x + y + z <= 50',
          '2x + y >= 36',
          'x + z >= 10'
        ].join('\n');
      }

      $scope.solve = function() {
        var equation = $scope.simplex.equation;
        var constraints = $scope.simplex.constraints.split('\n');
        $scope.result = Simplex.maximize(equation, constraints);
        $scope.result.values = _.omit($scope.result, 'tableaus');
      }
    }
  };
}
