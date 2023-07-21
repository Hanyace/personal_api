var http = require('http')
var app = require('../app')
var server = http.createServer(app)
require('../socket')(server)
module.exports = {
  server
}
