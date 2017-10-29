// given:
//  var numbers = [3, 1, 7];
//  var constant = 2;
// expected output printed
//  6
//  2
//  14

var numbers = [3, 1, 7]
var constant = 2
for (let k = 0; k < numbers.length; k += 1) {
  console.log(numbers[k] * constant)
}
console.log('k =', k)
