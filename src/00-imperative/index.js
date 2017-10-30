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
function multiplyBy (constant, numbers) {
  const byConstant = multiply(constant)
  return numbers.map(byConstant)
}
function main (print) {
  const constant = 2
  const numbers = immutable([3, 1, 7])
  return function dirty () {
    multiplyBy(constant, numbers).forEach(print)
  }
}
module.exports = {multiplyBy, main}
if (!module.parent) {
  main(unary(console.log))()
}
