var express = require('express')
var router = express.Router()
const sql = require('../db/sql')
const chartList = require('../db/chartList')
const { verificationToken } = require('../jwt')
const { responseData } = require('../utils/response')

// 获取聊天列表
router.get('/get', function (req, res, next) {
  const token = req.get('Authorization')
  if (!token) {
    res.json(responseData(401, '缺少token'))
    return
  }
  verificationToken(token)
    .then(async decode => {
      try {
        let result = await sql.get(chartList, { userId: decode.userId })
        res.json(responseData(200, '获取聊天列表获取成功', result))
      } catch (error) {
        res.json(responseData(200, '获取聊天列表获取失败'))
        console.log(error)
      }
    })
    .catch(err => {
      res.json(responseData(401, 'token失效'))
      console.log(err)
    })
})

// 删除聊天列表
router.post('/delete', function (req, res, next) {
  const token = req.get('Authorization')
  const data = req.body
  if (!token) {
    res.json(responseData(401, '缺少token'))
  } else {
    verificationToken(token)
      .then(async decode => {
        try {
          await sql.remove(chartList, {
            userId: decode.userId,
            friendId: data.friendId
          })
          res.json(responseData(200, '删除聊天列表成功'))
          console.log(decode.userId + '删除聊天列表成功')
        } catch (error) {
          res.json(responseData(200, '删除聊天列表失败'))
          console.log(error)
        }
      })
      .catch(err => {
        res.json(responseData(401, 'token失效'))
        console.log(err)
      })
  }
})

// 置顶聊天列表
router.post('/top', function (req, res, next) {
  const token = req.get('Authorization')
  const data = req.body
  if (!token) {
    res.json(responseData(401, '缺少token'))
  } else {
    verificationToken(token)
      .then(async decode => {
        try {
          await sql.set(
            chartList,
            {
              userId: decode.userId,
              friendId: data.friendId
            },
            {
              isTop: data.isTop,
              setTopTime: new Date().getTime()
            }
          )
          if (data.isTop) {
            res.json(responseData(200, '置顶聊天列表成功'))
          } else {
            res.json(responseData(200, '取消置顶聊天列表成功'))
          }
          console.log(decode.userId + '置顶聊天列表成功')
        } catch (error) {
          res.json(responseData(200, '置顶聊天列表失败'))
          console.log(error)
        }
      })
      .catch(err => {
        res.json(responseData(401, 'token失效'))
        console.log(err)
      })
  }
})

module.exports = router
