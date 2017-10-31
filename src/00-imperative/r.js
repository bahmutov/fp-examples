const Rx = require('rxjs/Rx')
const { tap } = require('ramda')
const numbers = Rx.Observable
  .of(3, 1, 7)
  .map(tap(x => console.log('passing', x)))
numbers.subscribe(console.log, console.error, () => console.log('done'))
numbers.subscribe(console.log, console.error, () => console.log('done'))
