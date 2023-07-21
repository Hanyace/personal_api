var express = require('express')
var router = express.Router()
const user = require('../db/users')
const sql = require('../db/sql')
const friendGroup = require('../db/friendGroup')
const uuid = require('node-uuid')
const { responseData } = require('../utils/response')
const { sendMail } = require('../utils/nodemailer')
const { randomCode } = require('../utils/math')

// router.get('/', function(req, res, next) {
//     res.send('register')
// });

// 注册
router.post('/', async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json;charset=utf-8')
  const data = req.body
  if (data.userName && data.password && data.tel && data.email) {
    if ((await sql.get(user, { email: data.email }))[0]) {
      res.json(responseData(200, '邮箱重复'))
      console.log('Error:邮箱重复')
      return
    } else if ((await sql.get(user, { tel: data.tel }))[0]) {
      res.json(responseData(200, '手机号重复'))
      console.log('Error:手机号重复')
      return
    } else {
      data.userId = uuid.v1()
      const num6 = randomCode(6)
      data.registerCode = num6
      const result = await sql.add(user, data)
      console.log(result)
      console.log(data.email)
      sendMail(data.email, num6)
      res.json(responseData(200, '已发送注册邮件到' + data.email + '请查收'))
      console.log(
        data.userName + '已发送注册邮件到' + data.email + ',code:' + num6
      )
    }
  } else {
    res.json(responseData(200, '缺少用户名密码或手机号'))
    console.log('Error:缺少用户名密码或手机号')
  }
  next()
})

// 验证注册码
router.post('/verify', async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json;charset=utf-8')
  const data = req.body
  if (data.email && data.registerCode) {
    const result = await sql.get(user, { email: data.email })
    // 判断是否已经注册
    if (result[0].isRegister) {
      res.json(responseData(200, '该邮箱已注册完成'))
      console.log(result[0].userName + '该邮箱已注册完成')
      return
    }
    // 判断是否过期
    const now = new Date().getTime()
    if (now - result[0].registerTime > 1000 * 60 * 5) {
      sql.remove(user, { email: data.email })
      res.json(responseData(200, '注册码已过期,请重新注册'))
      console.log(result[0].userName + '注册码已过期')
      return
    }
    if (result[0].registerCode === data.registerCode) {
      // 注册成功
      await sql.set(user, { email: data.email }, { isRegister: true })
      // 添加默认分组
      await sql.add(friendGroup, {userId: result[0].userId})
      res.json(responseData(200, '注册成功'))
      console.log(result[0].userName + '注册成功')
    } else {
      res.json(responseData(200, '注册码错误'))
      console.log(result[0].userName + '注册码错误')
    }
  } else {
    res.json(responseData(200, '缺少注册邮箱或注册码'))
    console.log('Error:缺少注册邮箱或注册码')
  }
  next()
})

module.exports = router
