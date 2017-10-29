/* eslint-env mocha */
it('prints numbers', () => {
  const sinon = require('sinon')
  sinon.spy(console, 'log')
  require('./index.js')
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
})
