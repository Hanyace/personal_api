var express = require('express')
var router = express.Router()
const fs = require('fs')
const path = require('path')
const { fileRoot } = require('../www/image')

/* GET users listing. */
router.get('*', function (req, res, next) {
  if (req.path.includes('/avatar')) {
    const filepath = path.join(fileRoot + req.path)
    fs.readFile(filepath, (err, data) => {
      if (err) {
        console.log(err)
      } else {
        res.setHeader('Content-Type', 'image/jpeg')
        res.send(data)
      }
      res.end()
    })
  }
})

module.exports = router
