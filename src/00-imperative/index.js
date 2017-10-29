// given:
//  var numbers = [3, 1, 7];
//  var constant = 2;
// expected output printed
//  6
//  2
//  14
'use strict'
const immutable = require('seamless-immutable')
function multiplyAndPrint (out) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  numbers.map(x => x * constant).forEach(x => out(x))
}
module.exports = multiplyAndPrint
if (!module.parent) {
  multiplyAndPrint(console.log)
}
