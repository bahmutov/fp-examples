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
