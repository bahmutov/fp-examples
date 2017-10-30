// given:
//  var numbers = [3, 1, 7];
//  var constant = 2;
// expected output printed
//  6
//  2
//  14
'use strict'
const immutable = require('seamless-immutable')
const {multiply, unary} = require('ramda')
function multiplyAndPrint (constant, numbers, out) {
  const byConstant = multiply(constant)
  const callOut = unary(out)
  numbers.map(byConstant).forEach(callOut)
}
module.exports = multiplyAndPrint
if (!module.parent) {
  const constant = 2
  const numbers = immutable([3, 1, 7])
  multiplyAndPrint(constant, numbers, console.log)
}
