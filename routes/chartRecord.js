var express = require('express')
var router = express.Router()
const sql = require('../db/sql')
const chartRecord = require('../db/chartRecord')
const { verificationToken } = require('../jwt')
const { responseData } = require('../utils/response')
const chartList = require('../db/chartList')

// 清空聊天记录表(修改)
router.post('/deleteAll', async (req, res, next) => {
  const token = req.get('Authorization')
  const data = req.body
  if (!token) {
    res.json(responseData(401, '缺少token'))
  } else {
    verificationToken(token)
      .then(async decode => {
        try {
          await sql.set(
            chartRecord,
            {
              friendId: data.friendId,
              userId: decode.userId
            },
            {
              messageStatus: 3
            },
            0
          )

          // 同时删掉聊天记录表里的消息
          await sql.remove(chartList, {
            userId: decode.userId,
            friendId: data.friendId
          })
          res.json(responseData(200, '清空聊天记录成功'))
          console.log(decode.userId + '清空聊天记录成功')
        } catch (error) {
          res.json(responseData(200, '清空聊天记录失败'))
          console.log(error)
        }
      })
      .catch(err => {
        res.json(responseData(401, 'token失效'))
        console.log(err)
      })
  }
})

// 获取聊天记录表
router.get('/get', async (req, res, next) => {
  const token = req.get('Authorization')
  if (!token) {
    res.json(responseData(401, '缺少token'))
  } else {
    verificationToken(token)
      .then(async decode => {
        try {
          let result = await sql.get(chartRecord, {
            userId: decode.userId,
            friendId: req.query.friendId
          })
          result = result.filter(item => item.messageNum != 3)
          res.json(responseData(200, '获取聊天记录成功', result))
          console.log(decode.userId + '获取聊天记录成功')
        } catch (error) {
          res.json(responseData(200, '获取聊天记录失败'))
          console.log(error)
        }
      })
      .catch(err => {
        res.json(responseData(401, 'token失效'))
        console.log(err)
      })
  }
})

// 删除单条聊天记录表
router.post('/delete', async (req, res, next) => {
  const token = req.get('Authorization')
  const data = req.body
  if (!token) {
    res.json(responseData(401, '缺少token'))
  } else {
    verificationToken(token)
      .then(async decode => {
        try {
          await sql.set(
            chartRecord,
            {
              friendId: data.friendId,
              userId: decode.userId,
              messageTime: data.messageTime
            },
            { messageStatus: 3 }
          )
          // 同时删掉聊天记录表里的消息
          // 判断是否删除的是最后一条消息
          const result = await sql.getOne(chartRecord, {
            userId: decode.userId,
            friendId: data.friendId
          },{messageTime: -1})
          if (result.messageTime === data.messageTime) {
            // 聊天表最后一条改为空字符串
            await sql.set(
              chartList,
              {
                userId: decode.userId,
                friendId: data.friendId
              },
              { lastMessage: '' }
            )
          }
          res.json(responseData(200, '删除单条聊天记录成功'))
          console.log(decode.userId + '删除单条聊天记录成功')
        } catch (error) {
          res.json(responseData(200, '删除单条聊天记录失败'))
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
