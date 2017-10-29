/* eslint-env mocha */
const sinon = require('sinon')
const multiplyThenPrint = require('./index')
it('produces numbers', () => {
  const cb = sinon.spy()
  multiplyThenPrint(cb)
  console.assert(cb.calledWith(6), 'produced 6')
  console.assert(cb.calledWith(2), 'produced 2')
  console.assert(cb.calledWith(14), 'produced 14')
})
