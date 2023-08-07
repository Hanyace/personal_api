const client = require('./index')
const cron = require('node-cron')
const sql = require('../db/sql')
const user = require('../db/users')
const chartRecord = require('../db/chartRecord')
const friendList = require('../db/friendList')
const chartList = require('../db/chartList')
const mongoose = require('mongoose')

// 定时任务
// 每1小时将聊天记录写入数据库
cron.schedule('0 * * * *', async userId => {
  console.log('定时任务开始')
  // 从redis中读取聊天记录
  const chartRecordRes = await client.zRange(`chartRecord:${userId}`, 0, -1)
  if (chartRecordRes.length === 0) return
  // 将聊天记录写入数据库
  for (const key in chartRecordRes) {
    const chartRecordObj = JSON.parse(chartRecordRes[key])
    await sql.set(
      chartRecord,
      { userId, friendId: chartRecordObj.friendId },
      chartRecordObj
    )
  }
  // 缓存到只剩下10条
  for (const key in chartRecordRes) {
    const chartRecordObj = JSON.parse(chartRecordRes[key])
    if (chartRecordObj.length > 10) {
      chartRecordObj.splice(0, chartRecordObj.length - 10)
      await client.zAdd(`chartRecord:${userId}`, chartRecordObj)
    }
  }
})

// 登录之后将用户好友表写入redis
exports.writeFriendList = async userId => {
  const friendListRes = await sql.populate(friendList, { userId }, 'friendId')
  await client.hSet(`friendList`, userId, JSON.stringify(friendListRes))
}

// 登录之后将用户信息写入redis
exports.writeUserInfo = async userId => {
  const userInfo = await sql.getOne(
    user,
    { _id: userId },
    {},
    {
      __v: 0,
      password: 0,
      isRegister: 0,
      registerCode: 0,
      time: 0,
      socketId: 0
    }
  )
  await client.hSet(`userInfo`, userId, JSON.stringify(userInfo))
}

// 登录之后将用户聊天表写入redis
exports.writeChartList = async userId => {
  const chartListRes = await sql.populate(chartList, { userId }, 'friendId')
  if (chartListRes.length === 0) return
  const chartListObj = {}
  chartListRes.forEach(item => {
    chartListObj[item.friendId._id] = JSON.stringify(item)
  })
  await client.hSet(`chartList:${userId}`, chartListObj)
}

// 离线之后将用户聊天表写入数据库
exports.writeChartListToDB = async userId => {
  // 从redis中读取聊天表
  const chartListRes = await client.hGetAll(`chartList:${userId}`)
  console.log(chartListRes)
  if (chartListRes.length === 0) return
  // 将聊天表写入数据库
  for (const key in chartListRes) {
    const chartListObj = JSON.parse(chartListRes[key])
    const friendId = mongoose.Types.ObjectId(key)
    console.log(chartListObj);
    // 如果没有使用add
    if (await sql.getOne(chartList, { userId, friendId })) {
      await sql.set(
        chartList,
        { userId, friendId: key },
        { ...chartListObj, friendId, lastMessage: chartListObj.lastMessage}
      )
    } else {
      await sql.add(
        chartList,
        { userId, friendId: key },
        { ...chartListObj, friendId, lastMessage: chartListObj.lastMessage}
      )
    }
  }
}

// 离线之后将聊天记录写入数据库
exports.writeChartRecordToDB = async userId => {
  // 从redis中读取聊天记录
  const chartRecordRes = await client.zRange(`chartRecord:${userId}`, 0, -1)
  if (chartRecordRes.length === 0) return
  // 将聊天记录写入数据库
  for (const key in chartRecordRes) {
    const chartRecordObj = JSON.parse(chartRecordRes[key])
    // 如果没有使用add
    if (
      await sql.getOne(chartRecord, {
        userId,
        friendId: chartRecordObj.friendId
      })
    ) {
      await sql.set(
        chartRecord,
        { userId, friendId: chartRecordObj.friendId },
        chartRecordObj
      )
    } else {
      await sql.add(
        chartRecord,
        { userId, friendId: chartRecordObj.friendId },
        chartRecordObj
      )
    }
  }
}
