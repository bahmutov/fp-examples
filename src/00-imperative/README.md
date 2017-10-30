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

See how `multiplyAndPrint` suddenly became a *pure* function? It is not affecting any global 
state and always produces the same result: calling passed callback function `cb` 3 times
with numbers 6, 2 and 14. In fact I like writing my code in this fashion, but surround it
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

Our function `multiplyAndPrint` is pure, even if calls a passed in impure callback function.
It only operates on the inputs, so if `cb` is pure or note - that is unknown and beyond
our function's control.

```js
function multiplyAndPrint (cb) {
  const numbers = immutable([3, 1, 7])
  const constant = 2
  for (let k = 0; k < numbers.length; k += 1) {
    cb(numbers[k] * constant)
  }
}
```

Other pure functions usually return something, maybe depending on the arguments

```jsx
// a function that always returns `true` value
const T = () => true
// an identity function that always returns whatever value provided
const I = (x) => x
// a function that produces virtual dom node using React JSX helper
const HelloWorld = ({name}) => {
  return (
    <div>Hello {name}<\/div>
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


