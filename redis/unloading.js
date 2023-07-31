const client = require('./index')
const cron = require('node-cron')
const sql = require('../db/sql')
const user = require('../db/users')
const chartRecord = require('../db/chartRecord')
const friendList = require('../db/friendList')
const chartList = require('../db/chartList')

// 定时任务

// 每天凌晨1点执行
cron.schedule('0 1 * * *', async () => {
  // 转存消息到数据库
})

// 登录之后将用户好友表写入redis
exports.writeFriendList = async userId => {
  const friendListRes = await sql.get(friendList, { userId })
  await client.hSet(`friendList`, userId, JSON.stringify(friendListRes))
}

// 登录之后将用户信息写入redis
exports.writeUserInfo = async userId => {
  const userInfo = await sql.getOne(user, { userId })
  await client.hSet(`userInfo`, userId, JSON.stringify(userInfo))
}

// 登录之后将用户聊天表写入redis
exports.writeChartList = async userId => {
  const chartListRes = await sql.get(chartList, { userId })
  if (chartListRes.length === 0) return
  const chartListObj = {}
  chartListRes.forEach(item => {
        chartListObj[item.friendId] = JSON.stringify(item)
    })
  await client.hSet(`chartList:${userId}`, chartListObj)
}
