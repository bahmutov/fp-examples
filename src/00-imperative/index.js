// given:
//  var numbers = [3, 1, 7];
//  var constant = 2;
// expected output printed
//  6
//  2
//  14
'use strict'
const immutable = require('seamless-immutable')
const mul = x => y => x * y
const unary = fn => x => fn(x)
function multiplyAndPrint (out) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  const byConstant = mul(constant)
  const callOut = unary(out)
  numbers.map(byConstant).forEach(callOut)
}
module.exports = multiplyAndPrint
if (!module.parent) {
  multiplyAndPrint(console.log)
}
