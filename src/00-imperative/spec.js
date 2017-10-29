/* eslint-env mocha */
const sinon = require('sinon')
const forget = require('require-and-forget')

it('prints numbers', () => {
  sinon.spy(console, 'log')
  forget('./index.js')
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
  console.log.restore()
})

it('prints numbers again', () => {
  sinon.spy(console, 'log')
  forget('./index.js')
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
  console.log.restore()
})

it.skip('does nothing', () => {
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
})
