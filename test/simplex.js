var _ = require('underscore');
var expect = require('chai').expect;
var Simplex = require('../src/simplex');

function roundResult(result, places) {
  places = places || 0;
  var factor = Math.pow(10, places);
  return _.reduce(result, function(result, value, key) {
    result[key] = Math.round(value * factor) / factor;
    return result;
  }, {});
}

describe('Simplex', function() {
  it('should solve an equation', function() {
    var result = Simplex.maximize('2x + 3y + 4z', [
      '3x + 2y + z <= 10',
      '2x + 5y + 3z <= 15'
    ]);
    expect(result.x).to.eql(0);
    expect(result.y).to.eql(0);
    expect(result.z).to.eql(5);
    expect(result.max).to.eql(20);
  });

  // http://stackoverflow.com/questions/6445736/has-anyone-seen-a-simplex-library-for-javascript-nodejs
  it('should solve an equation', function() {
    var result = Simplex.maximize('x + 2y - z', [
      '2x + y + z <= 14',
      '4x + 2y + 3z <= 28',
      '2x + 5y + 5z <= 30'
    ]);
    expect(result.x).to.eql(5);
    expect(result.y).to.eql(4);
    expect(result.z).to.eql(0);
    expect(result.max).to.eql(13);
  });

  // http://www.math.wsu.edu/faculty/dzhang/201/Guideline%20to%20Simplex%20Method.pdf
  it('should solve an equation', function() {
    var result = Simplex.maximize('3x + y', [
      '2x + y <= 8',
      '2x + 3y <= 12'
    ]);
    expect(result.x).to.eql(4);
    expect(result.y).to.eql(0);
    expect(result.max).to.eql(12);
  });

  // http://www.pstcc.edu/math/_files/pdf/simplex.pdf
  it('should solve an equation', function() {
    var result = Simplex.maximize('6x + 5y + 4z', [
      '2x + y + z <= 180',
      'x + 3y + 2z <= 300',
      '2x + y + 2z <= 240'
    ]);
    expect(result.x).to.eql(48);
    expect(result.y).to.eql(84);
    expect(result.z).to.eql(0);
    expect(result.max).to.eql(708);
  });

  // https://faculty.psau.edu.sa/filedownload/doc-6-pdf-d8e04b16451f7f67a5da5005d4e032ee-original.pdf
  it('should solve an equation', function() {
    var result = Simplex.maximize('6x1 - 8x2 + x3', [
      '3x1 + x2 <= 10',
      '4x1 - x2 <= 5',
      'x1 + x2 - x3 >= -3'
    ]);
    expect(result.x1).to.eql(1.25);
    expect(result.x2).to.eql(0);
    expect(result.x3).to.eql(4.25);
    expect(result.max).to.eql(11.75);
  });

  // http://econweb.ucsd.edu/~jsobel/172aw02/notes3.pdf
  it('should solve an equation', function() {
    var result = Simplex.maximize('2x1 + 4x2 + 3x3 + x4', [
      '3x1 + x2 + x3 + 4x4 <= 12',
      'x1 - 3x2 + 2x3 + 3x4 <= 7',
      '2x1 + x2 + 3x3 - x4 <= 10'
    ]);
    expect(result.x1).to.eql(0);
    expect(result.x2).to.eql(10.4);
    expect(result.x3).to.eql(0);
    expect(result.x4).to.eql(0.4);
    expect(result.max).to.eql(42);
  });

  it('should solve a hard equation', function() {
    var result = Simplex.maximize('a + 4b', [
      'a + b <= 1000',
      'a >= b'
    ]);
    expect(result.a).to.eql(500);
    expect(result.b).to.eql(500);
    expect(result.max).to.eql(2500);
  });

  it('should solve a hard equation', function() {
    var result = Simplex.maximize('a + 2b', [
      'a + b <= 300',
      'b = 2c',
      'c <= 50'
    ]);
    expect(result.a).to.eql(200);
    expect(result.b).to.eql(100);
    expect(result.c).to.eql(50);
    expect(result.max).to.eql(400);
  });

  it('should solve a mixed equation', function() {
    var result = Simplex.maximize('4a + b', [
      'a + b <= 1000',
      'b >= 20'
    ]);
    expect(result.a).to.eql(980);
    expect(result.b).to.eql(20);
    expect(result.max).to.eql(3940);
  });

  // http://college.cengage.com/mathematics/larson/elementary_linear/4e/shared/downloads/c09s5.pdf
  it('should solve a mixed equation', function() {
    var result = Simplex.maximize('x1 + x2 + 2x3', [
      '2x1 + x2 + x3 <= 50',
      '2x1 + x2 >= 36',
      'x1 + x3 >= 10'
    ]);
    expect(result.x1).to.eql(0);
    expect(result.x2).to.eql(36);
    expect(result.x3).to.eql(14);
    expect(result.max).to.eql(64);
  });

  // http://college.cengage.com/mathematics/larson/elementary_linear/4e/shared/downloads/c09s5.pdf
  it('should solve a mixed equation taco', function() {
    var result = Simplex.maximize('3x1 + 2x2 + 4x3', [
      '3x1 + 2x2 + 5x3 <= 18',
      '4x1 + 2x2 + 3x3 <= 16',
      '2x1 + x2 + x3 >= 4'
    ]);
    result = roundResult(result, 2);
    expect(result.x1).to.eql(0);
    expect(result.x2).to.eql(6.5);
    expect(result.x3).to.eql(1);
    expect(result.max).to.eql(17);
  });

  // http://www.math.sjsu.edu/~morris/mixedconstraints.pdf
  it('should solve a mixed equation', function() {
    var result = Simplex.maximize('3x1 + 4x2', [
      'x1 + x2 <= 12',
      '5x1 + 2x2 >= 36',
      '7x1 + 4x2 >= 14'
    ]);
    expect(result.x1).to.eql(4);
    expect(result.x2).to.eql(8);
    expect(result.max).to.eql(44);
  });

  // https://faculty.psau.edu.sa/filedownload/doc-6-pdf-d8e04b16451f7f67a5da5005d4e032ee-original.pdf
  it('should solve a mixed equation', function() {
    var result = Simplex.maximize('20x1 + 15x2', [
      'x1 + x2 >= 7',
      '9x1 + 5x2 <= 45',
      '2x1 + x2 >= 8'
    ]);
    expect(result.x1).to.eql(0);
    expect(result.x2).to.eql(9);
    expect(result.max).to.eql(135);
  });

  it('should not solve an invalid equation', function() {
    var result = Simplex.maximize('4a + b', [
      'a + b <= 1000',
      'a >= 600',
      'b >= 500'
    ]);
    expect(result).to.be.undefined;
  });

  it('should solve an example equation', function() {
    var result = Simplex.maximize('cp + fo', [
      'bcp + 5489699 + bfo + 16838158 <= 474168386',
      'bcp = 293.04cp',
      'bfo = 1654.42fo',
      'bfo >= 5073877'
    ]);

    result = roundResult(result);
    expect(result.cp).to.eql(1524593);
    expect(result.fo).to.eql(3067);
    expect(result.max).to.eql(1527660);
  });


  // arrestedToDetain = 1.32
  // arrestedToRemove = 1.60
  // detainedWithHearing = 0.45
  // detainedWithNoHearing = 0.55
  // detainedWithHearingRemoved = 0.87
  // detailedWithoutHearingRemove = 0.70
  // encounterVsApprehend = 3.23

  // detain = process / detainedWithHearing
  // identify = arrest * encounterVsApprehend
  // remove = ((process / detainedWithHearing) - process) * detailedWithoutHearingRemove + (process * detainedWithHearingRemoved)
  // r = ((p / .45) - p) * .7 + p * .87
  // r = (2.22p - p) * .7 + .87p
  // r = 1.22p * .7 + .87p
  // r = 1.724p
});
