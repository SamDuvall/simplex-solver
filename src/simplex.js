var _ = require('underscore');
var colors = require('colors');
var math = require('mathjs');
var debug = false;

function roundTo(value, places) {
  var factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

var Variable = {
  parse: function(text) {
    var regex = /([\.0-9]*)([a-zA-Z][a-zA-Z0-9]*)/;
    var result = text.match(regex);
    if (result) return {
      coefficient: result[1] ? parseFloat(result[1]) : 1,
      name: result[2]
    }
  }
}

var Equation = {
  operators: ['>=', '<=', '='],

  // Clone this side of the equation
  cloneSide: function(equation) {
    return _.map(equation, function(part) {
      if (_.isNumber(part)) return part;
      return _.clone(part);
    });
  },

  // Clone the equation
  clone: function(equation) {
    return {
      lhs: Equation.cloneSide(equation.lhs),
      operator: equation.operator,
      rhs: Equation.cloneSide(equation.rhs)
    }
  },

  // Flip the equation on its side
  flip: function(equation) {
    // Flip sides
    var lhs = equation.lhs;
    var rhs = equation.rhs;
    equation.lhs = rhs;
    equation.rhs = lhs;

    // Flip operator
    if (equation.operator == '<=') equation.operator = '>=';
    if (equation.operator == '>=') equation.operator = '<=';
  },

  // Go from a string 1x+2y=10 to parsed
  parseSide: function(equation) {
    var regex = /([\+\-\*\/])/;
    var parts = _.compact(equation.split(regex));
    return _.reduce(parts, function(result, part) {
      if (part == '-') result.sign = -1;
      else if (part == '+') result.sign = 1;
      else {
        var variable = Variable.parse(part);
        if (variable) {
          variable.coefficient *= result.sign;
          result.parts.push(variable);
        } else {
          var value = parseFloat(part) * result.sign;
          result.parts.push(value);
        }
      }
      return result;
    }, {
      sign: 1,
      parts: []
    }).parts;
  },

  // Go from a string 1x+2y=10 to parsed
  parse: function(equation) {
    // Condense content
    equation = equation.replace(/\s+/g, '');

    // Find the operator
    var operator = _.find(Equation.operators, function(operator) {
      return equation.indexOf(operator) != -1;
    });
    if (!operator) return;

    // Split the sides
    var sides = equation.split(operator);
    return {
      lhs: Equation.parseSide(sides[0]),
      operator: operator,
      rhs: Equation.parseSide(sides[1])
    }
  },

  // Convert to maximization equations
  toMaximizations: function(equation) {
    if (equation.operator == '<=') {
      return [equation];
    } else if (equation.operator == '>=') {
      var clone = Equation.clone(equation);
      Equation.flip(clone)
      return [clone];
    } else if (equation.operator == '=') {
      var lessThan = Equation.clone(equation);
      lessThan.operator = '<=';
      var greaterThan = Equation.clone(equation);
      greaterThan.operator = '>=';
      Equation.flip(greaterThan)
      return [lessThan, greaterThan];
    }
  },

  // Put all variables on the left and constants on the right
  normalize: function(equation) {
    // Move variable form rhs to lhs
    equation.rhs = _.reduce(equation.rhs, function(rhs, part) {
      if (part.name) equation.lhs.push({name: part.name, coefficient: -part.coefficient});
      else rhs.push(part);
      return rhs;
    }, []);

    // Move constants from lhs to rhs
    equation.lhs = _.reduce(equation.lhs, function(lhs, part) {
      if (!part.name) equation.rhs.push(-part);
      else lhs.push(part);
      return lhs;
    }, []);

    // Condense rhs
    equation.rhs = [_.reduce(equation.rhs, function(total, value) {
      return total + value;
    }, 0)];
  }
};

module.exports = {
  maximize: function(objective, constraints) {
    var objectiveEq = Equation.parse('max = ' + objective);
    var constraintEqs = _.chain(constraints).map(Equation.parse).map(Equation.toMaximizations).flatten().value();
    var equations = [objectiveEq].concat(constraintEqs);
    _.each(equations, Equation.normalize);

    function logCoefficients(highlightedRow, highlightedColumn) {
      var cellSize = 10;
      function formatCell(value) {
        while (value.length < cellSize) value = value + ' ';
        if (value.length > cellSize) value = value.substr(0, cellSize);
        return value;
      }

      // Log the variable names
      var slackVariables = _.times(rows - 1, function(index) { return 's' + (index + 1); });
      var allVariables = variables.concat(slackVariables, ['rhs']);
      var log = _.map(allVariables, function(variable, column) {
        var cell = formatCell(variable).bold;
        if (column == highlightedColumn) cell = cell.red;
        return cell;
      });
      console.log.apply(console, log);

      // Log each row
      _.each(coefficients, function(cells, row) {
        var highlightRow = row == highlightedRow;
        var log = _.map(cells, function(value, column) {
          var factor = Math.pow(10, cellSize);
          var rounded = Math.round(value * factor) / factor;
          var cell = formatCell(rounded + '');

          var highlightColumn = column == highlightedColumn;
          if (highlightRow || highlightColumn) cell = cell.red;
          if (highlightRow && highlightColumn) cell = cell.bold;
          return cell;
        });
        console.log.apply(console, log);
      });
      console.log();
    }

    function determineVariables() {
      return _.chain(equations).pluck('lhs').flatten().pluck('name').compact().uniq().value();
    }

    function determineCoefficients() {
      var slackRows = _.range(1, rows);
      return _.map(equations, function(equation, row) {
        var coefficients = _.map(variables, function(name) {
          var variable = _.findWhere(equation.lhs, {name: name});
          return variable ? variable.coefficient : 0;
        });
        var slacks = _.map(slackRows, function(slackRow) { return row == slackRow ? 1 : 0 })
        return coefficients.concat(slacks, equation.rhs);
      });
    }

    function performPivot(pivotRow, pivotColumn) {
      if (debug) {
        var log = ['Pivot', 'Row', pivotRow + 1, 'Column', pivotColumn + 1].join(' ');
        console.log(log.inverse);
        console.log();
      }

      // Convert pivot row coefficient to 1
      var ratio = coefficients[pivotRow][pivotColumn];
      _.times(columns, function(column) {
        coefficients[pivotRow][column] = coefficients[pivotRow][column] / ratio;
      });

      if (debug) {
        var log = ['R' + (pivotRow + 1), '=', 'R' + (pivotRow + 1), '÷', roundTo(ratio, 3)].join(' ');
        console.log(log.underline);
        logCoefficients(pivotRow, pivotColumn);
      }

      // Convert non-pivot row coefficient to 0
      _.times(rows, function(row) {
        var ratio = coefficients[row][pivotColumn] / coefficients[pivotRow][pivotColumn];
        if (row == pivotRow || ratio == 0) return;

        _.times(columns, function(column) {
          coefficients[row][column] -= ratio * coefficients[pivotRow][column];
        });

        if (debug) {
          var log = ['R' + (row + 1), '=', 'R' + (row + 1), ratio >= 0 ? '+' : '-', roundTo(Math.abs(ratio), 3), '×', 'R' + (pivotRow + 1)].join(' ');
          console.log(log.underline);
          logCoefficients(row, pivotColumn);
        }
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
      return _.reduce(variables, function(result, variable, column) {
        var values = _.times(rows, function(row) {
          return coefficients[row][column];
        });

        var zeros = _.filter(values, function(value) { return value == 0; }).length;
        var ones = _.filter(values, function(value) { return value == 1; }).length;
        if (ones == 1 && zeros == values.length - 1) var row = _.indexOf(values, 1);

        result[variable] = row != undefined ? coefficients[row][columns - 1] : 0;
        return result;
      }, {});
    }

    var rows = constraintEqs.length + 1;
    var variables = determineVariables();
    var coefficients = determineCoefficients();
    var columns = coefficients[0].length;

    if (debug) {
      console.log('Starting Equations'.underline);
      logCoefficients();
    }

    while (runPhase1());
    if (!isFeasible()) return;

    while (runPhase2());
    return determineSolution();
  }
}
