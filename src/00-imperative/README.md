## Goal

Given an array of numbers and a constant, multiply each number by the constant
and print the result

```js
// given:
var numbers = [3, 1, 7];
var constant = 2;
// expected output printed
//  6
//  2
//  14
```

We start with imperative code

```js
var numbers = [3, 1, 7]
var constant = 2
for (var k = 0; k < numbers.length; k += 1) {
  console.log(numbers[k] * constant)
}
// 6
// 2
// 14
```

Great, but this code is "hairy" - it has sticking parts, variables that are exposed, and can
interact with the outside code. For example, variable `k` that is *only* used to iterate the
array can now be used by other code.

```js
var numbers = [3, 1, 7]
var constant = 2
for (var k = 0; k < numbers.length; k += 1) {
  console.log(numbers[k] * constant)
}
console.log('k =', k)
// 6
// 2
// 14
// k = 3
```

Luckily, ES6 can solve variable problem inside the `for ...` loop

```js
var numbers = [3, 1, 7]
var constant = 2
for (let k = 0; k < numbers.length; k += 1) {
  console.log(numbers[k] * constant)
}
console.log('k =', k)
// 6
// 2
// 14
// index.js:14
// console.log('k =', k)
//                    ^
// ReferenceError: k is not defined
```

We also want our code to *describe* what it does; we want to understand what is going
to happen by reading the *static source code*. In this example, the constant `constant`
should *be really a constant*.

```js
var numbers = [3, 1, 7]
var constant = 2
for (let k = 0; k < numbers.length; k += 1) {
  console.log(numbers[k] * constant)
  constant = 10
}
// 6
// 10
// 70
```

Again, ES6 to the rescue.

```js
var numbers = [3, 1, 7]
const constant = 2
for (let k = 0; k < numbers.length; k += 1) {
  console.log(numbers[k] * constant)
  constant = 10
}
// 6
// index.js:13
//  constant = 10
//           ^
// TypeError: Assignment to constant variable.
```

We can even catch this assignment without running the code by using a linter
like [eslint](http://eslint.org/) and [standard](https://standardjs.com/) (which is really
built on top of `eslint`)

```
standard --verbose --fix 'src/**/*.js'

standard: Use JavaScript Standard Style (https://standardjs.com)
  index.js:13:3: 'constant' is constant. (no-const-assign)
```

Great, and since we want to express that we are NOT modifying the input array, let us
declare the array constant.

```js
const numbers = [3, 1, 7]
const constant = 2
for (let k = 0; k < numbers.length; k += 1) {
  console.log(numbers[k] * constant)
}
```

But of course JavaScript lies about it. 

```js
const numbers = [3, 1, 7]
const constant = 2
numbers[0] = 100
for (let k = 0; k < numbers.length; k += 1) {
  console.log(numbers[k] * constant)
}
// 200
// 2
// 14
```

In JavaScript `const X = Y` means only the `X` is constant, not the inner values of `Y`
if `Y` is an object or an array. And this leads to lots of troubles, because passing arrays
and objects to other functions means they can be modified *even when you hope they stay
constant*.

Using 3rd party library like [seamless-immutable](https://github.com/rtfeldman/seamless-immutable)
we can silently prevent modifications to our data

```js
const immutable = require('seamless-immutable')
const numbers = immutable([3, 1, 7])
const constant = 2
numbers[0] = 100
for (let k = 0; k < numbers.length; k += 1) {
  console.log(numbers[k] * constant)
}
// 6
// 2
// 14
```

Even better, by running in strict mode we can throw an exception when trying to modify
immutable object.

```js
'use strict'
const immutable = require('seamless-immutable')
const numbers = immutable([3, 1, 7])
const constant = 2
numbers[0] = 100
// index.js:4
// numbers[0] = 100
//            ^
// TypeError: Cannot assign to read only property '0' of object '[object Array]'
```

## Testing

How can we test this code? We cannot get into the `for` loop, and the only way to test it is
to intercept the *side effects* - the printing to the console object. We can write a unit
test to spy on `console.log` using [sinon](http://sinonjs.org/) with 
cmo[mocha](https://mochajs.org/) test runner

```js
/* eslint-env mocha */
it('prints numbers', () => {
  const sinon = require('sinon')
  sinon.spy(console, 'log')
  require('./index.js')
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
})
```

Everything is beautiful when we run this test

```
mocha src/**/*spec.js

6
2
14
  ✓ prints numbers (154ms)

  1 passing (163ms)
```

But JavaScript and Node lie to you, or at least do not tell you the complete story.
Add another test that *does nothing*, like this

```js
/* eslint-env mocha */
it('prints numbers', () => {
  const sinon = require('sinon')
  sinon.spy(console, 'log')
  require('./index.js')
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
})

it('does nothing', () => {
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
})
```

If you run these tests, the assertions in the second test pass!
```
mocha src/**/*spec.js

6
2
14
  ✓ prints numbers (178ms)
  ✓ does nothing

  2 passing (187ms)
```

The first test "polluted" the global shared environment. Not only it added spy methods
to `console.log`, it did not even reset them after the first test. The spy methods, and
the "dirty state" after the first test introduced an entanglement between the two tests.
For example, we can not just run the second test by itself - it will crash.

```js
it.only('does nothing', () => {
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
})
```
```
mocha src/**/*spec.js

  1) does nothing

  0 passing (11ms)
  1 failing

  1) does nothing:
     TypeError: console.log.calledWith is not a function
      at Context.it.only (spec.js:12:30)
```

If we cannot run any unit test in isolation, that means debugging and testing our code
becomes a nightmare. Some of these interdependencies in the tests can be found by randomizing
order of tests on every run, which test runner [rocha](https://github.com/bahmutov/rocha)
does. 

But even more subtle is the global state pollution that happens when we use statement 
`require('./index.js')`. In Node environment, this command reads the source of the file 
`./index.js` and *evaluates it* using JavaScript engine. Thus it executes all the statements
in the program (creating a numbers list, iterating over it, multiplying and printing the
result). Then Node `require` caches the evaluated result (which in this case is `undefined` value
because the module does not export anything). Which means if we `require('./index.js')`
again, Node will NOT evaluate the code, and will NOT print the numbers.

```js
const sinon = require('sinon')

it('prints numbers', () => {
  sinon.spy(console, 'log')
  require('./index.js')
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
  console.log.restore()
})

it('prints numbers again', () => {
  sinon.spy(console, 'log')
  require('./index.js')
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
  console.log.restore()
})
```
```
mocha src/**/*spec.js

6
2
14
  ✓ prints numbers
  1) prints numbers again
  - does nothing

  1 passing (25ms)
  1 pending
  1 failing

  1) prints numbers again:

      AssertionError: printed 6
      + expected - actual

      -false
      +true
      
      at Console.assert (console.js:95:23)
      at Context.it (src/00-imperative/spec.js:16:11)
```

Exactly the same code inside the test does two different things when we execute it.
We cannot just read the source and understand what is going on anymore - because it
will produce different results! So it is difficult to test it, because of Node caching.
We can fix this particular case when testing by removing the module from the
global require cache, for example by using 
[require-and-forget](https://github.com/bahmutov/require-and-forget)

```js
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
```
Now we truly force re-evaluation and re-running of `index.js` code inside each test
```
mocha src/**/*spec.js

6
2
14
  ✓ prints numbers
6
2
14
  ✓ prints numbers again

  2 passing (22ms)
```
