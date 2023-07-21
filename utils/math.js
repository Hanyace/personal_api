exports.randomCode = function (many) {
  var num = ''
  for (var i = 0; i < many; i++) {
    num += Math.floor(Math.random() * 10)
  }
  return num
}
