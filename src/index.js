var _ = require('underscore');
var Equation = require('./equation');

function determineVariables(equations) {
  return _.chain(equations).pluck('lhs').flatten().pluck('name').compact().uniq().value();
}

function determineCoefficients(equations, variables) {
  var slackRows = _.range(1, equations.length);
  return _.map(equations, function(equation, row) {
    var coefficients = _.map(variables, function(name) {
      var variable = _.findWhere(equation.lhs, {name: name});
      return variable ? variable.coefficient : 0;
    });
    var slacks = _.map(slackRows, function(slackRow) { return row == slackRow ? 1 : 0 })
    return coefficients.concat(slacks, equation.rhs);
  });
}

module.exports = {
  maximize: function(objective, constraints) {

    function addTableau(pivot) {
      // Determine all the variables
      var slackVariables = _.times(rows - 1, function(index) { return 's' + (index + 1); });
      var allVariables = variables.concat(slackVariables, ['rhs']);

      // Create the tableau
      tableaus.push({
        variables: allVariables,
        rows: _.map(coefficients, _.clone),
        pivot: pivot
      });
    }

    function performPivot(pivotRow, pivotColumn) {
      // Add to the list of tableaus
      addTableau({row: pivotRow, column: pivotColumn});

      // Convert pivot row coefficient to 1
      var ratio = coefficients[pivotRow][pivotColumn];
      _.times(columns, function(column) {
        coefficients[pivotRow][column] = coefficients[pivotRow][column] / ratio;
      });

      // Convert non-pivot row coefficient to 0
      _.times(rows, function(row) {
        var ratio = coefficients[row][pivotColumn] / coefficients[pivotRow][pivotColumn];
        if (row == pivotRow || ratio == 0) return;

        _.times(columns, function(column) {
          coefficients[row][column] -= ratio * coefficients[pivotRow][column];
        });
      });

      return true;
    }

    function findInfeasibleRow() {
      var rowNumbers = _.range(1, rows);
      return _.find(rowNumbers, function(row) {
        var rowCoefficients = coefficients[row];
        var rhs = rowCoefficients[rowCoefficients.length - 1];
        return rhs < 0;
      });
    }

    function findInfeasibleColumn(pivotRow) {
      var columns = _.range(1, variables.length);
      return _.find(columns, function(column) {
        var coefficient = coefficients[pivotRow][column];
        return coefficient < 0;
      });
    }

    function runPhase1() {
      var pivotRow = findInfeasibleRow();
      if (pivotRow) var pivotColumn = findInfeasibleColumn(pivotRow);
      if (pivotColumn) return performPivot(pivotRow, pivotColumn);
    }

    function determinePivotColumn() {
      var columnNumbers = _.range(1, columns - 1);
      return _.reduce(columnNumbers, function(result, column) {
        var coefficient = coefficients[0][column];

        if (coefficient < 0 && (!result.coefficient || coefficient < result.coefficient)) result = {
          column: column,
          coefficient: coefficient
        };
        return result;
      }, {}).column;
    }

    function determinePivotRow(pivotColumn) {
      var rowNumbers = _.range(1, rows);
      var row = _.reduce(rowNumbers, function(result, row) {
        var rowCoefficients = coefficients[row];
        var rhs = rowCoefficients[rowCoefficients.length - 1];
        var coefficient = rowCoefficients[pivotColumn];
        var ratio = rhs / coefficient;

        if (coefficient > 0 && ratio >= 0 && (!result.ratio || ratio < result.ratio)) result = {
          row: row,
          ratio: ratio
        };
        return result;
      }, {}).row;

      return row;
    }

    function runPhase2() {
      var pivotColumn = determinePivotColumn();
      if (pivotColumn) var pivotRow = determinePivotRow(pivotColumn);
      if (pivotRow) return performPivot(pivotRow, pivotColumn);
    }

    function isFeasible() {
      return !findInfeasibleRow();
    }

    function determineSolution() {
      // Add to the list of tableaus
      addTableau();

      // Pull out all the variables
      return _.reduce(variables, function(result, variable, column) {
        var values = _.times(rows, function(row) {
          return coefficients[row][column];
        });

        var zeros = _.filter(values, function(value) { return value == 0; }).length;
        var ones = _.filter(values, function(value) { return value == 1; }).length;
        if (ones == 1 && zeros == values.length - 1) var row = _.indexOf(values, 1);

        result[variable] = row != undefined ? coefficients[row][columns - 1] : 0;
        return result;
      }, {
        tableaus: tableaus
      });
    }

    // Format the Equations
    var objectiveEq = Equation.parse('max = ' + objective);
    var constraintEqs = _.chain(constraints).map(Equation.parse).map(Equation.toMaximizations).flatten().value();
    var equations = [objectiveEq].concat(constraintEqs);
    _.each(equations, Equation.normalize);

    // Create the matrix
    var variables = determineVariables(equations);
    var coefficients = determineCoefficients(equations, variables);
    var rows = constraintEqs.length + 1;
    var columns = coefficients[0].length;
    var tableaus = [];

    // Run Phase 1 (get the negative right hand sides out)
    while (runPhase1());
    if (!isFeasible()) return;

    // Run Phase 2 (optimize!)
    while (runPhase2());
    return determineSolution();
  }
}
