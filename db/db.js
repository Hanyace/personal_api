const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/personal')

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.on('connected', function () {
  console.log('mongodb连接成功')
})
db.on('disconnected', function () {
  console.log('mongodb断开')
})

module.exports = mongoose
