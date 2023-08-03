var express = require('express')
var router = express.Router()
const user = require('../db/users')
const sql = require('../db/sql')
const jwt = require('jsonwebtoken')
const { key } = require('../jwt_key')
const { responseData } = require('../utils/response')

const JWT_KEY = key

router.post('/', async (req, res, next) => {
  const { userName, password } = req.body
  const result = await sql.getOne(user, { userName, password })
  if (result) {
    const token = jwt.sign({ _id: result._id }, JWT_KEY, {
      expiresIn: 3600
    })
    sql.set(user, { userName },  { status: 1 })
    res.json(responseData(200, '登录成功', { token }))
    console.log(userName + '登录成功')
  } else {
    res.json(responseData(200, '账号或密码错误'))
  }
})

module.exports = router
