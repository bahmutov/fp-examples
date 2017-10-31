/* eslint-env mocha */
const { equals } = require('ramda')
const { multiplyBy, main } = require('./index')
const snapshot = require('snap-shot-it')
it('produces numbers', () => {
  const result = multiplyBy(2, [3, 1, 7])
  console.assert(equals(result, [6, 2, 14]))
})
it('works in different situations', () => {
  snapshot(
    multiplyBy,
    [2, []], // empty list numbers
    [10, [1]], // single number
    [2, [3, 1, 7]], // our example test case
    [-1, [0, 1, 2, 3]] // negative constant
  )
})
it('returns stream of multiplied numbers', function(done) {
  this.timeout(2500)
  const app = main()
  const numbers = []
  app.subscribe(x => numbers.push(x), null, () => {
    console.assert(equals(numbers, [6, 2, 14]))
    done()
  })
})
it('tests first number', function(done) {
  const app = main()
  app.take(1).subscribe(x => console.assert(x === 2), null, done)
})
it('tests second number', function(done) {
  const app = main()
  app
    .skip(1)
    .take(1)
    .subscribe(x => console.assert(x === 2), null, done)
})
