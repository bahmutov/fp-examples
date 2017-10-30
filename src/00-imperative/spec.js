/* eslint-env mocha */
const {equals} = require('ramda')
const {multiplyBy} = require('./index')
const snapshot = require('snap-shot-it')
it('produces numbers', () => {
  const result = multiplyBy(2, [3, 1, 7])
  console.assert(equals(result, [6, 2, 14]))
})
it('works in different situations', () => {
  snapshot(multiplyBy,
    [2, []], // empty list numbers
    [10, [1]], // single number
    [2, [3, 1, 7]], // our example test case
    [-1, [0, 1, 2, 3]] // negative constant
  )
})
