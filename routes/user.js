var express = require('express')
var router = express.Router()
const user = require('../db/users')
const sql = require('../db/sql')
const chartList = require('../db/chartList')
const friendList = require('../db/friendList')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const { key } = require('../jwt_key')
const multer = require('../utils/multer')
const { responseData } = require('../utils/response')
const { verificationToken } = require('../jwt')

const JWT_KEY = key

// 获取用户信息
router.get('/user_info', function (req, res, next) {
  const token = req.get('Authorization')
  jwt.verify(token, JWT_KEY, async (err, decode) => {
    if (err) {
      res.json(responseData(401, 'token失效'))
    } else {
      try {
        const result = await sql.get(
          user,
          { userId: decode.userId },
          {},
          {
            __v: 0,
            _id: 0,
            password: 0,
            isRegister: 0,
            registerCode: 0,
            time: 0,
            socketId: 0
          }
        )
        res.json(responseData(200, '获取成功', result[0]))
      } catch (error) {
        res.json(responseData(200, '获取失败'))
      }
    }
  })
})

// 上传图片
router.post('/upload_avatar', (req, res, next) => {
  const data = req.files[0]
  const port = 3000
  //  解析原数据
  const token = req.get('Authorization')
  if (!token) {
    res.json(responseData(401, '缺少token'))
  } else {
    jwt.verify(token, JWT_KEY, async (err, decode) => {
      if (err) {
        res.json(responseData(401, 'token失效'))
      } else {
        try {
          const fileObj = path.parse(data.originalname)
          const newFile = data.path + '-' + fileObj.base
          fs.renameSync(data.path, newFile)
          const urlData = `${req.protocol}://${req.hostname}:${port}${multer.file_target}/${data.filename}-${fileObj.base}`
          console.log(decode.userId)
          sql.set(user, { userId: decode.userId }, { avatar: urlData })
          res.json(responseData(200, '上传成功', { url: urlData }))
        } catch (error) {
          console.log(error)
          res.json(responseData(200, '上传失败'))
        }
      }
    })
  }
})

// 查询用户聊天表
router.get('/chart_list', async (req, res, next) => {
  const token = req.get('Authorization')
  if (!token) {
    res.json(responseData(401, '缺少token'))
  } else {
    jwt.verify(token, key, async (err, decode) => {
      if (err) {
        res.json(responseData(401, 'token失效'))
      } else {
        try {
          const result = await sql.get(chartList, { userId: decode.userId })
          res.json(responseData(200, '获取成功', result))
        } catch (error) {
          res.json(responseData(200, '获取失败'))
        }
      }
    })
  }
})

// 查询用户好友列表
router.get('/friend_list', async (req, res, next) => {
  const token = req.get('Authorization')
  if (!token) {
    res.json(responseData(401, '缺少token'))
  } else {
    verificationToken(token)
      .then(async decode => {
        try {
          const result = await sql.get(friendList, { userId: decode.userId })
          res.json(responseData(200, '获取成功', result))
        } catch (error) {
          res.json(responseData(200, '获取失败'))
          console.log(error)
        }
      })
      .catch(err => {
        res.json(responseData(401, 'token失效'))
        console.log(err)
      })
  }
})

// 搜索用户
router.post('/search_user', async (req, res, next) => {
  const token = req.get('Authorization')
  const { searchTerm } = req.body
  if (!token) {
    res.json(responseData(401, '缺少token'))
  } else {
    verificationToken(token)
      .then(async decode => {
        try {
          let result = null
          if(searchTerm.includes('@')){
             result = await sql.getOne(
              user, { email: searchTerm }, {}, {
                __v: 0,
                _id: 0,
                password: 0,
                isRegister: 0,
                registerCode: 0,
                time: 0,
                socketId: 0
              }
            )
          }
          else {
            const reg = new RegExp(searchTerm, 'i')
            result = await sql.get(
              user, { username: reg }, {}, {
                __v: 0,
                _id: 0,
                password: 0,
                isRegister: 0,
                registerCode: 0,
                time: 0,
                socketId: 0
              }
            )
          }
          res.json(responseData(200, '获取成功', result))
        } catch (err) {
          res.json(responseData(200, '获取失败'))
          console.log(err)
        }
      })
      .catch(err => {
        res.json(responseData(401, 'token失效'))
        console.log(err)
      })
  }
})

// 通过id查询用户
router.post('/search_user_by_id', async (req, res, next) => {
  const token = req.get('Authorization')
  const { id } = req.body
  if (!token) {
    res.json(responseData(401, '缺少token'))
  } else {
    verificationToken(token)
      .then(async decode => {
        try {
          const result = await sql.getOne(
            user, { userId:id }, {}, {
              __v: 0,
              _id: 0,
              password: 0,
              isRegister: 0,
              registerCode: 0,
              time: 0,
              socketId: 0
            }
          )
          res.json(responseData(200, '获取成功', result))
        } catch (err) {
          res.json(responseData(200, '获取失败'))
          console.log(err)
        }
      })
      .catch(err => {
        res.json(responseData(401, 'token失效'))
        console.log(err)
      })
  }
})
module.exports = router
