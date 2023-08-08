const sql = require('../db/sql')
const user = require('../db/users')
const chartRecord = require('../db/chartRecord')
const chartList = require('../db/chartList')
const friendList = require('../db/friendList')
const client = require('../redis')
const dayjs = require('dayjs')
var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)
// 避免直接使用硬盘数据库

// 单聊
exports.singleChart = (socket, io) => {
  socket.on('singleChart', async data => {
    console.log(data)

    const messageTime = new Date().getTime()
    try {
      // 不太可能出现这种情况不存在就不是好友,所以不用判断
      // const friend = await sql.getOne(user, { userId: data.friendId })
      // // 判断好友是否存在
      // if (!friend) {
      //   console.log('Error:好友不存在')
      //   io.to(socket.id).emit('singleChartRes', {
      //     message: '好友不存在',
      //     originData: data,
      //     fail: true,
      //     sendTime: data.sendTime
      //   })
      //   return
      // }
      // 判断是否添加了好友
      // 使用redis 读取好友表
      let friendList = await client.hGet(`friendList`, data.userId)
      friendList = JSON.parse(friendList)
      // console.log(friendList);
      let userInfo = await client.hGet(`userInfo`, data.userId)
      userInfo = JSON.parse(userInfo)
      const isFrind = friendList.find(
        item => item.friendId._id === data.friendId
      )
      if (!isFrind || isFrind.friendType != 1) {
        console.log('Error:还不是好友')
        io.to(socket.id).emit('singleChartRes', {
          message: '还不是好友',
          originData: data,
          fail: true,
          sendTime: data.sendTime
        })
        return
      }
      // 判断是否被拉黑
      if (isFrind.friendType === 3) {
        console.log('Error:已被拉黑')
        io.to(socket.id).emit('singleChartRes', {
          message: '已被拉黑',
          originData: data,
          fail: true,
          sendTime: data.sendTime
        })
        return
      }
      // 使用redis hash存储消息
      await client.zAdd(`chartRecord:${data.userId}`, {
        score: messageTime,
        value: JSON.stringify({
          ...data,
          messageTime,
          messageStatus: 0
        })
      })
      // await sql.add(chartRecord, { ...data, messageTime, messageStatus: 0 })
      // 获取好友中我的聊天表(从redis中获取)
      let friendChartList = await client.hGet(
        `chartList:${data.friendId}`,
        `${data.userId}`
      )

      let messageNum = 0
      if (friendChartList) {
        friendChartList = JSON.parse(friendChartList)
        // 之前有
        messageNum = friendChartList.messageNum + 1
        // 更新好友表
        // 更新好友的
        await client.hSet(
          `chartList:${data.friendId}`,
          `${data.userId}`,
          JSON.stringify({
            lastTime: messageTime,
            lastMessage: data.message,
            messageType: data.messageType,
            messageNum,
            isTop: false,
            setTopTime: null,
            friendId: userInfo,
            userId: data.friendId
          })
        )
        // sql.set(
        //   chartList,
        //   { userId: data.friendId, friendId: data.userId },
        //   {
        //     lastTime: messageTime,
        //     lastMessage: data.message,
        //     messageType: data.messageType,
        //     messageNum: messageNum
        //   }
        // )
        // 更新自己的
        await client.hSet(
          `chartList:${data.userId}`,
          `${data.friendId}`,
          JSON.stringify({
            lastTime: messageTime,
            lastMessage: data.message,
            messageType: data.messageType,
            messageNum: 0,
            isTop: false,
            setTopTime: null,
            friendId: isFrind.friendId,
            userId: data.userId
          })
        )
        // sql.set(
        //   chartList,
        //   { userId: data.userId, friendId: data.friendId },
        //   {
        //     lastTime: messageTime,
        //     lastMessage: data.message,
        //     messageType: data.messageType,
        //     messageNum: 0
        //   }
        // )
      } else {
        // 之前没有
        // 创建好友和我的聊天表
        // 好友
        await client.hSet(
          `chartList:${data.friendId}`,
          `${data.userId}`,
          JSON.stringify({
            lastTime: messageTime,
            lastMessage: data.message,
            messageType: data.messageType,
            messageNum: 1,
            isTop: false,
            setTopTime: null,
            friendId: userInfo,
            userId: data.friendId
          })
        )
        // await sql.add(chartList, {
        //   userId: data.friendId,
        //   friendId: data.userId,
        //   lastTime: messageTime,
        //   lastMessage: data.message,
        //   messageType: data.messageType,
        //   messageNum: 1
        // })
        // 我的
        await client.hSet(
          `chartList:${data.userId}`,
          `${data.friendId}`,
          JSON.stringify({
            lastTime: messageTime,
            lastMessage: data.message,
            messageType: data.messageType,
            messageNum: 0,
            isTop: false,
            setTopTime: null,
            friendId: isFrind.friendId,
            userId: data.userId
          })
        )
        // await sql.add(chartList, {
        //   userId: data.userId,
        //   friendId: data.friendId,
        //   lastTime: messageTime,
        //   lastMessage: data.message,
        //   messageType: data.messageType,
        //   messageNum: 0
        // })
      }
      // 单聊界面发送
      const emitData = {
        friendId: data.friendId,
        message: data.message,
        messageType: data.messageType,
        messageTime
      }
      // 列表界面发送
      const emitListData = {
        lastTime: messageTime,
        lastMessage: data.message,
        messageType: data.messageType
      }
      // 如果好友在线
      const isOnline = await client.hGet('userSatatus', data.friendId)
      console.log('isOnline', isOnline)
      const friendSocketId = await client.hGet('socketId', data.friendId)
      // let chatListOfMe = await client.hGet(
      //   `chartList:${data.friendId}`,
      //   data.userId
      // )
      // chatListOfMe = JSON.parse(chatListOfMe)
      // console.log(chatListOfMe)
      if (isOnline != 0) {
        //朋友
        // let messageNum = chatListOfMe.messageNum
        // console.log(friendSocketId)
        io.to(friendSocketId).emit('singleChart', emitData)
        //朋友
        io.to(friendSocketId).emit('chartList', {
          ...emitListData,
          friendId: data.userId,
          messageNum: messageNum
        })
      }
      //自己
      io.to(socket.id).emit('singleChartRes', {
        ...emitData,
        isMe: true,
        sendTime: data.sendTime
      })
      //自己
      io.to(socket.id).emit('chartList', {
        ...emitListData,
        friendId: data.friendId,
        messageNum: 0
      })
    } catch (error) {
      console.log('Error:' + error)
    }
  })
}

// chatList
// 1:读取
// 2:删除
// 3:置顶
// 4:取消置顶

exports.chatList = (socket, io) => {
  socket.on('chatList', async data => {
    const { type, userId, friendId } = data
    // 先获取chartList里好友那条
    let friend = await client.hGet(`chartList:${userId}`, `${friendId}`)
    friend = JSON.parse(friend)
    // 将消息状态改为已读
    try {
      if (type == 1) {
        client.hSet(`chartList:${userId}`, `${friendId}`, JSON.stringify({
          ...friend,
          messageNum: 0
        }))
        io.to(socket.id).emit('chartList', {
          type: 1,
          friendId: friendId
        })
      } else if (type == 2) {
        client.hDel(`chartList:${userId}`, `${friendId}`)
        io.to(socket.id).emit('chartList', {
          type: 2,
          friendId: friendId
        })
      } else if (type == 3) {
        const setTopTime = new Date().getTime()
        client.hSet(`chartList:${userId}`, `${friendId}`, JSON.stringify({
          ...friend,
          isTop: true,
          setTopTime
        }))
        io.to(socket.id).emit('chartList', {
          type: 3,
          friendId: friendId,
          setTopTime
        })
      } else if (type == 4) {
        client.hSet(`chartList:${userId}`, `${friendId}`, JSON.stringify({
          ...friend,
          isTop: false,
          setTopTime: null
        }))
        io.to(socket.id).emit('chartList', {
          type: 4,
          friendId: friendId
        })
      }
    } catch (error) {}
  })
}
