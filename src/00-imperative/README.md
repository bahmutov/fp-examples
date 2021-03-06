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

We can reset our sinon spies after each test

```js
const sinon = require('sinon')
beforeEach(() => {
  sinon.spy(console, 'log')
})
afterEach(() => {
  console.log.restore()
})
it('prints numbers', () => {
  require('./index.js')
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
})
```

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

Still, the testing is difficult because loading the code definition should NOT mean running it!
It is easy to fix this though, just define a function and export it without calling it. Let
the test or user code run it.

```js
'use strict'
const immutable = require('seamless-immutable')
function multiplyAndPrint () {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  for (let k = 0; k < numbers.length; k += 1) {
    console.log(numbers[k] * constant)
  }
}
module.exports = multiplyAndPrint
```
Our test now can explicitly call the function before checking the console log.
```js
/* eslint-env mocha */
const sinon = require('sinon')
const multiplyThenPrint = require('./index')
it('prints numbers', () => {
  sinon.spy(console, 'log')
  multiplyThenPrint()
  console.assert(console.log.calledWith(6), 'printed 6')
  console.assert(console.log.calledWith(2), 'printed 2')
  console.assert(console.log.calledWith(14), 'printed 14')
  console.log.restore()
})
it('prints numbers again', () => {
  sinon.spy(console, 'log')
  multiplyThenPrint()
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
6
2
14
  ✓ prints numbers again

  2 passing (19ms)
```

## Fighting side effects

Yet we still have a side effect in our code - printing to the console log. While we can
read the code and understand what it does, we still cannot tell what the entire effect of
it will do. Because to the user the output of running this code 1 time will be just 3 numbers
printed (6, 2 and 14). But if the code is running several times, then the entire screen will
be covered in these numbers. Printing to the console is the *side-effect* that makes code
hard to predict and use. Other common side-effects are writing to the database, making network
calls, changing the DOM of the web application. We need to separate pure logic of our code
(multiplying list of numbers) from the code producing side effects.

In our case it is simple. Do not hard code `console.log`, instead
pass the "side-effect" function as input parameter.
```js
'use strict'
const immutable = require('seamless-immutable')
function multiplyAndPrint (cb) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  for (let k = 0; k < numbers.length; k += 1) {
    cb(numbers[k] * constant)
  }
}
module.exports = multiplyAndPrint
```

See how `multiplyAndPrint` function suddenly became a little cleaner? It is still affecting the global
state by calling `cb` argument directly, so if `cb` is doing the side effect, then its caller is
also doing the side effect.

But still we made progress in my opinion - our code is a little bit more testable.
I like writing my code in this fashion, but surround it
with default "dirty" bits. For example if we load this file as a top level module, we
probably want to print the numbers!
```js
'use strict'
const immutable = require('seamless-immutable')
function multiplyAndPrint (cb) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  for (let k = 0; k < numbers.length; k += 1) {
    cb(numbers[k] * constant)
  }
}
module.exports = multiplyAndPrint
if (!module.parent) {
  multiplyAndPrint(console.log)
}
```
```
$ node .
6
2
14
```

When we unit test this code, we do not want to pollute the console log either. Instead
`sinon` can create a dummy spy callback function for us, which we can check and dispose
automatically with memory garbage collection.

```js
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
```

Perfect, our tests are much simpler because we refactored our side effects and replaced
[mocking with passing input arguments](https://glebbahmutov.com/blog/mocking-vs-refactoring/).

## The pure examples and return values

Our function `multiplyAndPrint` is not pure yet, because it calls a passed in impure callback function.

```js
function multiplyAndPrint (cb) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  for (let k = 0; k < numbers.length; k += 1) {
    cb(numbers[k] * constant)
  }
}
```

Pure functions usually return something, maybe depending on the arguments

```jsx
// a function that always returns `true` value
const T = () => true
// an identity function that always returns whatever value provided
const I = (x) => x
// a function that produces virtual dom node using React JSX helper
const HelloWorld = ({name}) => {
  return (
    <div>Hello {name}</div>
  )
}
// a function that produces virtual dom node using "virtual-dom" library
const h = require('virtual-dom/h')
const render = ({name}) =>
  h('div', {}, [`Hello ${name}`])
```

Let the fact that `multiplyAndPrint` has no return value not bother you. It really uses
the input argument `cb` to "return" produced values. It is just that instead of a single
produced value it needs to return *multiple* values one by one.

## Notes about imperative code

Notice that while we made a pure function `multiplyAndPrint` we did NOT write the code inside
using declarative style. Instead it is imperative loop iteration. The two aspects (`imperative`
vs `declarative` and `pure` vs `side-effects`) are close, but separate. Functional programming
style usually wants each function to be both `pure` and `declarative`. Here is how we can refactor
our function to *declare* what the code does, but *not how to do it*.

```js
'use strict'
const immutable = require('seamless-immutable')
function multiplyAndPrint (out) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  numbers.map(x => x * constant).forEach(x => out(x))
}
module.exports = multiplyAndPrint
```

We are using built-in methods from the JavaScript ES5 arrays to map over the list
of numbers and to call the `out` callback. The `[].map` call produces new list of
numbers, which is great, it does not modify data, which is what we want. But the code
looks a little weird, because we have small utility functions that deal on *each item*.
Let us factor them out and give them descriptive readable names for clarity.

```js
'use strict'
const immutable = require('seamless-immutable')
function multiplyAndPrint (out) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  const byConstant = x => x * constant
  const callOut = x => out(x)
  numbers.map(byConstant).forEach(callOut)
}
module.exports = multiplyAndPrint
```

Last line reads almost like natural English `numbers.map(byConstant).forEach(callOut)`
but why do we need a separate `const callOut = x => out(x)` function? Well, because
JavaScript defines `Array.forEach` to expect 3 arguments, not just the value, but
a value, its index and the entire array. If we simply call `out`, we will get extra
values

```js
function multiplyAndPrint (out) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  const byConstant = x => x * constant
  numbers.map(byConstant).forEach(out)
}
```
```
$ node .
6 0 [ 6, 2, 14 ]
2 1 [ 6, 2, 14 ]
14 2 [ 6, 2, 14 ]
```

Plus our unit test would fail, because the spy function would be called with 3 arguments,
not a single one each time.

By having an extra `x => out(x)` we are ignoring all arguments, but the first one.
In a sense, we are converting function `out` into a "unary" function that only
expects a single argument.

## Function reuse

The above code has two little utility functions - one to multiply by a constant, and
another to convert a function into a unary function. These actions are so common, we
can and should write a library of reusable functional "bits".

First, the multiplication by a constant. A typical multiplication function
would be simply `const mul = (x, y) => x * y` but in our case we know the first
argument (the constant) very early. We know the second argument much later - only
during the iteration over the list we get to know the `y` argument so we can
multiply. When the first argument is known waaaay before the second, we should

* put the argument likely to be know first at the first position in the function signature
* curry the function

Read [Put callback first for elegance][put-callback-first] for more discussion of this.
In our code, this means we will write multiplication to get first argument and return
the function that expects the second argument, and then multiplies the two.

[put-callback-first]: https://glebbahmutov.com/blog/put-callback-first-for-elegance/

```js
const mul = x => y => x * y
[1, 2, 3].map(mul(10))
// [10, 20, 30]
```

For clarity, we can name the intermediate function

```js
'use strict'
const immutable = require('seamless-immutable')
const mul = x => y => x * y
function multiplyAndPrint (out) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  const byConstant = mul(constant)
  const callOut = x => out(x)
  numbers.map(byConstant).forEach(callOut)
}
```

As far as second small function `callOut`, again, we will make a reusable utility
that operates on an input function.

```js
'use strict'
const immutable = require('seamless-immutable')
const mul = x => y => x * y
const unary = fn => x => fn(x)
function multiplyAndPrint (out) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  const byConstant = mul(constant)
  const callOut = unary(out)
  numbers.map(byConstant).forEach(callOut)
}
```

Aside: this is a defining trait of a functional programmer in my opinion - changing
behavior of functions by "adapting" them and creating complex algorithms by composing
many small primitive functions.

## Using libraries

Notice, we just increased the amount of code in our solution. Yet the functions we have
created `mul` and `unary` are so commonly needed, other developers have coded them again
and again. And even collected them into nice well-tested libraries like
[ramda](http://ramdajs.com/docs/), meaning we do not have to code *or test* a lot of code!

```js
'use strict'
const immutable = require('seamless-immutable')
const {multiply, unary} = require('ramda')
function multiplyAndPrint (out) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  const byConstant = multiply(constant)
  const callOut = unary(out)
  numbers.map(byConstant).forEach(callOut)
}
module.exports = multiplyAndPrint
```

Notice that by using `Ramda` I skip testing *so much code*, because I am reusing a lot of
the code battle-tested by thousands of people.

## Input to output

Our example is very artificial, because the input array is hard coded. Usually the
input numbers are passed from the outside.

```js
'use strict'
const immutable = require('seamless-immutable')
const {multiply, unary} = require('ramda')
function multiplyAndPrint (numbers, out) {
  const constant = 2
  const byConstant = multiply(constant)
  const callOut = unary(out)
  numbers.map(byConstant).forEach(callOut)
}
module.exports = multiplyAndPrint
if (!module.parent) {
  const numbers = immutable([3, 1, 7])
  multiplyAndPrint(numbers, console.log)
}
```

We can even move the constant to be an argument too.

```js
'use strict'
const immutable = require('seamless-immutable')
const {multiply, unary} = require('ramda')
function multiplyAndPrint (constant, numbers, out) {
  const byConstant = multiply(constant)
  const callOut = unary(out)
  numbers.map(byConstant).forEach(callOut)
}
module.exports = multiplyAndPrint
if (!module.parent) {
  const constant = 2
  const numbers = immutable([3, 1, 7])
  multiplyAndPrint(constant, numbers, console.log)
}
```

Next, let us return the processed array, so that the outside caller
attaches the "dirty" side-effect. We probably should rename `multiplyAndPrint` to
simply `multiplyBy` because it no longer prints.

```js
'use strict'
const immutable = require('seamless-immutable')
const {multiply, unary} = require('ramda')
function multiplyBy (constant, numbers) {
  const byConstant = multiply(constant)
  return numbers.map(byConstant)
}
module.exports = multiplyBy
if (!module.parent) {
  const constant = 2
  const numbers = immutable([3, 1, 7])
  multiplyBy(constant, numbers).forEach(unary(console.log))
}
```

We literally have two functions (well, one function and one code block).
Function `multiplyBy` has main data processing logic and is pure. The code block below
is setting up the data flow and also handles side effects.

```js
if (!module.parent) {
  const constant = 2
  const numbers = immutable([3, 1, 7])
  multiplyBy(constant, numbers).forEach(unary(console.log))
}
```

The above code block is like the `main` function often found in different programming
languages that starts the execution. Let us make this function explicit.

```js
'use strict'
const immutable = require('seamless-immutable')
const {multiply, unary} = require('ramda')
function multiplyBy (constant, numbers) {
  const byConstant = multiply(constant)
  return numbers.map(byConstant)
}
function main () {
  const constant = 2
  const numbers = immutable([3, 1, 7])
  multiplyBy(constant, numbers).forEach(unary(console.log))
}
module.exports = {multiplyBy, main}
if (!module.parent) {
  main()
}
```

Because we still export `multiplyBy` is so easy to unit test it.
```js
/* eslint-env mocha */
const {equals} = require('ramda')
const {multiplyBy} = require('./index')
it('produces numbers', () => {
  const result = multiplyBy(2, [3, 1, 7])
  console.assert(equals(result, [6, 2, 14]))
})
```
We can even test it with many, many inputs using
[data driven testing](https://github.com/bahmutov/snap-shot-it/#data-driven-testing).
I am not even going to compute by hand the expected values, but will just check if
produces snapshot after running the test once.

```js
const {multiplyBy} = require('./index')
const snapshot = require('snap-shot-it')
it('works in different situations', () => {
  snapshot(multiplyBy,
    [2, []], // empty list numbers
    [10, [1]], // single number
    [2, [3, 1, 7]], // our example test case
    [-1, [0, 1, 2, 3]] // negative constant
  )
})
```
This produces the snapshot file with inputs - outputs pairs
```js
exports["works in different situations multiplyBy 1"] = {
  name: "multiplyBy",
  behavior: [
    {
      given: [2, []],
      expect: []
    },
    {
      given: [10, [1]],
      expect: [10]
    },
    {
      given: [2, [3, 1, 7]],
      expect: [6, 2, 14]
    },
    {
      given: [-1, [0, 1, 2, 3]],
      expect: [0, -1, -2, -3]
    }
  ]
};
```
Snapshot testing makes unit testing a pure function a breeze.

## Pure main

Our main function is producing side effects. Is there anything we can do to make it
pure, to *clean it up*?

```js
function main () {
  const constant = 2
  const numbers = immutable([3, 1, 7])
  multiplyBy(constant, numbers).forEach(unary(console.log))
}
```

Turns out, we can. We already pushed the side effect (printing to the console) once
out from `multiplyBy`, and we can do this trick again. Only we will combine it with
another, more subtle trick. Notice that `main` is producing the side effect only
because it *executes console.log*. If `main` somehow only "told" someone to execute
`console.log(...)` then `main` would be pure, and that someone would be "dirty" instead.

The simplest case is for `main` to return a "dirty" function.

```js
function main () {
  const constant = 2
  const numbers = immutable([3, 1, 7])
  return function dirty () {
    multiplyBy(constant, numbers).forEach(unary(console.log))
  }
}
module.exports = {multiplyBy, main}
if (!module.parent) {
  main()()
}
```

Look at this weird `main`. It still schedules the side effects logic, but
**does not execute it**. Instead it returns a new function ingenuously named `dirty`.
The `main` is pure, and we can predict what it will do by reading its source code,
even if we run `main` a million times. It will return an instance of `dirty` function
a million times! The actual side effect only happens when this block runs

```js
if (!module.parent) {
  main()()
}
```

If we often print to the console (and I think we do!), we could even abstract
it a little bit, and pass the `console.log` into `main`, just like we did
before, when we were making `multiplyBy` a pure function.

```js
function main (print) {
  const constant = 2
  const numbers = immutable([3, 1, 7])
  return function dirty () {
    multiplyBy(constant, numbers).forEach(print)
  }
}
module.exports = {multiplyBy, main}
if (!module.parent) {
  main(unary(console.log))()
}
```
We are passing printing to the console as an argument to the `main` function,
but notice we only *call it from the returned function*. Thus the side
effect of calling `console.log` is "contained" and does not "spot" the `main`
function itself. Pretty neat, right?

## Beyond console log

Printing to the console is the simplest case we could think of. But other
side effects (like asynchronous operations, input and output) can also be
performed from the returned function by scheduling "dirty actions" rather
than kicking them off inside the `main` function.
See [Is framework pure or not?](https://glebbahmutov.com/blog/is-framework-pure-or-not/)
blog post for example.

## Async data

In realistic cases, the input data is not hard coded in our code. Instead
we probably ask user or a server for it. Not only that, we probably do not
get the entire list of numbers to process, but rather one number at a time,
and more numbers can arrive in the future. Thus we cannot just pass an array
of numbers as an input to and output from our function `multiplyBy`.
Instead we should pass a more powerful data structure. Something that can
deal with asynchronously arriving infinite lists. Luckily, this structure
exists and is quite popular in the JavaScript world today: it is an
Observable.

I am going to use [RxJS v5](http://reactivex.io/rxjs)
and replace Array of numbers with an Observable of numbers.

```js
'use strict'
const Rx = require('rxjs/Rx')
const {multiply, unary} = require('ramda')
function multiplyBy (constant, numbers) {
  const byConstant = multiply(constant)
  return numbers.map(byConstant)
}
function main (print) {
  const constant = 2
  const numbers = Rx.Observable.of(3, 1, 7)
  return function dirty () {
    multiplyBy(constant, numbers).forEach(print)
  }
}
module.exports = {multiplyBy, main}
if (!module.parent) {
  main(unary(console.log))()
}
```

When running this from the terminal, it produces the same result. But we have
a very powerful library at our disposal. For example, we can process 1
number per second. Just make a stream of seconds, zip it with stream of
numbers, picking the number - and voilà! We got ourselves a pure `main`
function that operates on real asynchronous streams of events.

```js
function main (print) {
  const constant = 2
  const numbers = Rx.Observable.of(3, 1, 7)
  return function dirty () {
    const seconds = Rx.Observable.timer(0, 1000)
    const numberPerSecond = Rx.Observable.zip(
      numbers,
      seconds,
      (number, seconds) => number
    )
    multiplyBy(constant, numberPerSecond).forEach(print)
  }
}
```
What is making the function `dirty` impure? When does the side effect actually
happen? We know when the function is executed - when it is called using `fn()`
notation. But what about event streams? Turns out it is more complicated
(and at the same time strangely similar to functions).

Replace method call `.forEach(print)` with `.map(print)`. It should still print,
right? After all, `[1, 2, 3].map(console.log)` prints!

```js
// rest of the code stays the same
// instead of
// multiplyBy(constant, numberPerSecond).forEach(print)
// just have .map
multiplyBy(constant, numberPerSecond).map(print)
```

Run the program and ... nothing happens. No numbers, nothing. The program
just exits without any output. What is going on? Turns out the Observables
we have created are "cold" or "off" by default. They are ready to go, all connected
into a pipeline - but the data is not flowing yet. In order to start the events
flowing through the observable steps, one must call `subscribe`.

```js
Rx.Observable.of(3, 1, 7)
  .subscribe(console.log, console.error, () => console.log('done'))
// 3
// 1
// 7
// done
```

When calling subscribe, we provided three callback functions: on event,
on error and on stream completed. What's interesting, if we subscribe
several times, then the stream will execute several times.

```js
const numbers = Rx.Observable.of(3, 1, 7)
numbers.subscribe(console.log, console.error, () => console.log('done'))
numbers.subscribe(console.log, console.error, () => console.log('done'))
// 3
// 1
// 7
// done
// 3
// 1
// 7
// done
```

Even more, *all steps* of the pipeline execute for each subscription.
We can see this by logging messages in the intermediate steps.

```js
// r.js
const Rx = require('rxjs/Rx')
const {tap} = require('ramda')
const numbers = Rx.Observable.of(3, 1, 7).map(tap(x => console.log('passing', x)))
numbers.subscribe(console.log, console.error, () => console.log('done'))
numbers.subscribe(console.log, console.error, () => console.log('done'))
```
```
$ node ./r.js
passing 3
3
passing 1
1
passing 7
7
done
passing 3
3
passing 1
1
passing 7
7
done
```

In our original `main` program, we had a single subscription - `Observable.forEach`
internally calls method `Observable.subscribe`. Even timer interval only starts
generating 1 second increments when we are subscribing, otherwise it is dormant.

In a sense, observables are like function declarations, and subscribing to a cold
observable is like executing the function. We can execute same function multiple
times and we can "flow" the observable N times by subscribing to it also N times.

## Pure pipeline

This brings us to the last refactoring. If data does not flow through the
pipeline we have built until someone calls `.subscribe()`, then our `main`
can just return a cold Observable. Outside application code can then
`.subscribe()` to this observable, kicking off the flow of events and
triggering the side effects.

```js
function main (print) {
  const constant = 2
  const numbers = Rx.Observable.of(3, 1, 7)
  const seconds = Rx.Observable.timer(0, 1000)
  const numberPerSecond = Rx.Observable.zip(
    numbers,
    seconds,
    (number, seconds) => number
  )
  return multiplyBy(constant, numberPerSecond).map(print)
}
```

See how `main` instead of returning a function, deferring execution of
side effects simply builds and returns an Observable? It is also carefully
avoids triggering "hidden" `.subscribe()` inside `.forEach()` by
replacing it with `.map()` call.

So far so good, `main` is still a pure function. What about the code
block triggering the execution? It is almost as simple as before.

```js
if (!module.parent) {
  main(unary(console.log)).subscribe()
}
```

The "app bootstrap" code block does two important things

- it passes a way to perform side-effect into the `main` function
- it kicks off the flow of data through the pipeline returned by `main`

## If you want to do dirty things, just send them out

The `main` still has one limitation and one weird thing about it

```js
function main (print) {
  const constant = 2
  const numbers = Rx.Observable.of(3, 1, 7)
  const seconds = Rx.Observable.timer(0, 1000)
  const numberPerSecond = Rx.Observable.zip(
    numbers,
    seconds,
    (number, seconds) => number
  )
  return multiplyBy(constant, numberPerSecond).map(print)
}
```

1. Passing every method to call to do side effect as an argument to `main` will quickly grow old. Maybe instead we could come up with a way for `main` to "signal" whenever it wants to do a side effect?
2. Using `.map(print)` to do a side effect without triggering `Observable.subscribe()` and the data flow is weird and non-intuitive.

We can solve both problems by switching the things around. Instead of passing `print` as an input argument to `main` we can return an *Observable of print events*! Yes, we can! Isn't this beautiful - our data flow of events can be used to flow "side effect events" out of our beautiful, pure `main` and into the outside "dirty" world. Almost like a body digesting food and ... well, let's not go there.

Since we already returning a stream, let us keep doing that. The "application" code block that bootstraps our `main` will know that the output is a stream of numbers to print to the console. Thus it will no longer even pass `print` into the `main`.

```js
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
```

See how we created a small pipeline inside `main`, returned it, stored it in the variable `app` and then started flowing data through it by calling `app.subscribe()`? Beautiful, isn't it? One of the strongest points about this code is that `main` is as testable as `multiplyBy` function. We kind of ignored unit testing for a little while, it is time to come back to testing again. Using `done` callback we can use asynchronous Mocha test to accumulate numbers and then compare them against the expected result.

```js
it('returns stream of multiplied numbers', function (done) {
  this.timeout(2500)
  const app = main()
  const numbers = []
  app.subscribe(x => numbers.push(x), null, () => {
    console.assert(equals(numbers, [6, 2, 14]))
    done()
  })
})
```

Simple, isn't it? Of course testing becomes more complex when you want to confirm timing of events, but the main point still stands. Our `main` function is pure - the test can control the input (if there were any), and receives the output stream, which it can inspect when it completes.

We can even play tricks and for example only consider the first number in the stream, or the second by skipping and taking N numbers. Then the test becomes even simpler:

```js
it('tests first number', function(done) {
  const app = main()
  app.take(1).subscribe(x => console.assert(x === 6), null, done)
})
it('tests second number', function(done) {
  const app = main()
  app
    .skip(1)
    .take(1)
    .subscribe(x => console.assert(x === 2), null, done)
})
```

## Passing inputs

Hardcoding the timer stream inside `main` seems a little limiting. Why should we always want our numbers multiplied a number once per second? Let us send it into `main` as a "control" stream. And while we are it, we can send the numbers stream and the constant - all inputs. The result is still the same - it pints a number multiplied by a constant at 1fps. But now we have a lot more power, because instead of a timer, for example, we could, I don't know ... like send numbers entered by the user from the command line.

Reading numbers until the user presses a magic key like "Enter" using Rx
looks like this.

```js
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
// to use
// const key$ = getKeys()
// key$.subscribe(...)
```

There is common convention to name Observables using `$` character at the end, sort of like plural `S`. That is why we have variables `key$` and `enter$` for the stream of all key presses and the stream of just "Enter" key presses.

We create a stream of key presses from `process.stdin` using `readline` and `Rx.Observable.fromEvent` utility method. We process events until the first `enter$` event happens. When it happens the stream completes and we close the program.

```js
if (!module.parent) {
  const constant = 2
  const key$ = getKeys()
  const app = main(constant, key$.map(Number).do(console.log))
  app.subscribe(console.log, console.error, _ => {
    console.log('done with keys')
    process.exit(0)
  })
}
```
We get the input (side effect!) outside the `main`, pass the stream into the `main`, and get the returned stream to print. Then we subscribe to the returned stream, kicking off our application. The input stream of key presses completes when the user presses "Enter" key, halting all attached streams, triggering `process.exit(0)`. I convert key presses to Numbers and print them while passing (statement `key$.map(Number).do(console.log)`). When running odd lines are the original numbers and the even lines are the multiplied ones.

```
$ node .
2
4
3
6
done with keys
```

Pretty sweet, isn't it? We completely isolated the pure logic of the program from its inputs and outputs by passing around Observables.

## Connection to the web world

1. Observables are like arrays, but deal better with infinite streams of events. There are lots of operators that deal with time, collections of events and asynchronous operations. Think: type ahead search.
2. Our model of moving the code that deals with side effects outside the `main` function helps no only in testing but in connecting any component to the database, to the DOM and to the server - all things that are just side-effects.

A good framework for doing this [Cycle.js](https://cycle.js.org/). All inputs to the `main` are Observables from different non-pure objects, like DOM, HTTP, WebSockets. Our function `main` returns Observables to update DOM, send HTTP requests and WebSocket data frames.

```js
function main({DOM}) {
  // map from DOM events to logical actions (intent)
  const decrement$ = DOM
    .select('.decrement').events('click').map(ev => -1)
  const increment$ = DOM
    .select('.increment').events('click').map(ev => +1)
  // update internal data model
  const action$ = Observable.merge(decrement$, increment$)
  const count$ = action$.startWith(0).scan((x,y) => x+y)
  // stream of virtual view events
  const vtree$ = count$.map(count =>
    div([
      button('.decrement', 'Decrement'),
      button('.increment', 'Increment'),
      p('Counter: ' + count)
    ])
  )
  // output DOM stream
  return { DOM: vtree$ }
}
```

You can see the flow in action at [https://glebbahmutov.com/draw-cycle/](https://glebbahmutov.com/draw-cycle/)

The inputs and outputs to the `main` function are called *sources* and *sinks* respectively, because the events flow from sources to sinks. The outside "application" bootstrapping code creates the sources object, and gets the corresponding sinks. In Cycle.js land the code responsible for creating a source and corresponding sink (like DOM or HTTP) is called *a driver* - just like OS drivers are responsible for connecting OS to the actual hardware.

Here is an example of an HTTP driver that gets a random user profile when the button is clicked. This example comes from [Cycle.js website](https://cycle.js.org/basic-examples.html#basic-examples-http-requests)

```js
function main({DOM}) {
  const getRandomUser$ = DOM.select('.get-random').events('click')
    .map(() => {
      const randomNum = Math.round(Math.random() * 9) + 1;
      return {
        url: 'https://jsonplaceholder.typicode.com/users/' + String(randomNum),
        category: 'users',
        method: 'GET'
      }
    })
  // more code
  return {
    HTTP: getRandomUser$
  }
}
```
So in order to make an outgoing HTTP request we just return a JSON object in the `HTTP` Observable. But how do we receive a result? We read it from the `HTTP` source Observable passed into the `main`. Note that we use `category: "users"` to separate different requests.

```js
function main({DOM, HTTP}) {
  // same getRandomUser$ code as above
  const user$ = HTTP.select('users')
    .flatten()
    .map(res => res.body)
    .startWith(null)
  // more code
  return {
    HTTP: getRandomUser$
  }
}
```

What do we once we get an event in `user$` stream? We map it to the virtual dom event and send to DOM stream!

```js
function ({DOM, HTTP}) {
  // same getRandomUser$ code as above
  // same user$ code as above
  div('.users', [
      button('.get-random', 'Get random user'),
      user === null ? null : div('.user-details', [
        h1('.user-name', user.name),
        h4('.user-email', user.email),
        a('.user-website', {attrs: {href: user.website}}, user.website)
      ])
    ])
  )
  return {
    DOM: vdom$,
    HTTP: getRandomUser$
  }
}
```

Finally, our boostrapping code has to create `DOM`, `HTTP` streams and connect sinks and sources.

```js
Cycle.run(main, {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
})
```

Interesting, and completely isolated from the actual browser DOM or from network.

## Connecting components to other components

Instead of custom template syntax to pass properties down to child DOM components, components can exchange Observables to pass properties, gaining a lot of power without any new syntax. See [Why use reactive streams for components?](https://glebbahmutov.com/blog/why-use-reactive-streams-for-components/) for examples.

## Universal web applications

Because our `main` logic is completely isolated from the outside world, we can render our application on the server or on the client - it is just a question of picking the right drivers to handle our events.
