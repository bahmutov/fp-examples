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
function main (constant, numbers) {
  return multiplyBy(constant, numbers)
}
module.exports = { multiplyBy, main }
function getKeys () {
  const readline = require('readline')
  readline.emitKeypressEvents(process.stdin)
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }
  const key$ = Rx.Observable.fromEvent(process.stdin, 'keypress')
  const enter$ = key$.filter(s => s === '\r')
  return key$.takeUntil(enter$)
}
if (!module.parent) {
  const constant = 2
  const key$ = getKeys()
  const app = main(constant, key$.map(Number).do(console.log))
  app.subscribe(console.log, console.error, _ => {
    console.log('done with keys')
    process.exit(0)
  })
}
