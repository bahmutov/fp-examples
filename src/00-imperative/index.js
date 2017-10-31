// given:
//  var numbers = [3, 1, 7];
//  var constant = 2;
// expected output printed
//  6
//  2
//  14
'use strict'
const Rx = require('rxjs/Rx')
const { multiply } = require('ramda')
function multiplyBy (constant, numbers) {
  const byConstant = multiply(constant)
  return numbers.map(byConstant)
}
function main (constant, numbers, control) {
  const nums = Rx.Observable.zip(numbers, control, (number, _) => number)
  return multiplyBy(constant, nums)
}
module.exports = { multiplyBy, main }
if (!module.parent) {
  const constant = 2
  const numbers = Rx.Observable.of(3, 1, 7)
  const seconds = Rx.Observable.timer(0, 1000)
  const app = main(constant, numbers, seconds) // nothing is executing yet
  app.subscribe(console.log) // GO!
}
