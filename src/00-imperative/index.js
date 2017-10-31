// given:
//  var numbers = [3, 1, 7];
//  var constant = 2;
// expected output printed
//  6
//  2
//  14
'use strict'
const Rx = require('rxjs/Rx')
const { multiply, unary } = require('ramda')
function multiplyBy (constant, numbers) {
  const byConstant = multiply(constant)
  return numbers.map(byConstant)
}
function main () {
  const constant = 2
  const numbers = Rx.Observable.of(3, 1, 7)
  const seconds = Rx.Observable.timer(0, 1000)
  const numberPerSecond = Rx.Observable.zip(
    numbers,
    seconds,
    (number, seconds) => number
  )
  return multiplyBy(constant, numberPerSecond)
}
module.exports = { multiplyBy, main }
if (!module.parent) {
  const app = main() // nothing is executing yet
  app.subscribe(console.log) // GO!
}
