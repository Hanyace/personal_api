const sql = require('../db/sql')
const user = require('../db/users')
const chartRecord = require('../db/chartRecord')
const chartList = require('../db/chartList')
const friendList = require('../db/friendList')

// 单聊
exports.singleChart = (socket, io) => {
  socket.on('singleChart', async data => {
    const messageTime = new Date().getTime()
    try {
      await sql.add(chartRecord, { ...data, messageTime, messageStatus: 0 })
      const friend = (await sql.get(user, { userId: data.friendId }))[0]
      // 判断好友是否存在
      if (!friend) {
        console.log('Error:好友不存在')
        io.to(socket.id).emit('error', {
          message: '好友不存在',
          originData: data
        })
        return
      }
      // 判断是否添加了好友
      const isFrind = (
        await sql.get(friendList, {
          userId: data.userId,
          friendId: data.friendId
        })
      )[0]
      if (!isFrind) {
        console.log('Error:还不是好友')
        io.to(socket.id).emit('error', {
          message: '还不是好友',
          originData: data
        })
        return
      }
      // 判断是否被拉黑
      if (isFrind.friendType === 3) {
        console.log('Error:已被拉黑')
        io.to(socket.id).emit('error', {
          message: '已被拉黑',
          originData: data
        })
        return
      }
      // 获取好友中我的聊天表
      const friendChartList = (
        await sql.get(chartList, {
          userId: data.friendId,
          friendId: data.userId
        })
      )[0]
      let messageNum = 0
      if (friendChartList) {
        // 之前有
        messageNum = friendChartList.messageNum + 1
        // 更新好友表
        // 更新好友的
        sql.set(
          chartList,
          { userId: friend.userId, friendId: data.userId },
          {
            lastTime: messageTime,
            lastMessage: data.message,
            messageType: data.messageType,
            messageNum: messageNum
          }
        )
        // 更新自己的
        sql.set(
          chartList,
          { userId: data.userId, friendId: friend.userId },
          {
            lastTime: messageTime,
            lastMessage: data.message,
            messageType: data.messageType,
            messageNum: 0
          }
        )
      } else {
        // 之前没有
        // 创建好友和我的聊天表
        await sql.add(chartList, {
          userId: data.friendId,
          friendId: data.userId,
          lastTime: messageTime,
          lastMessage: data.message,
          messageType: data.messageType,
          messageNum: 1
        })
        // 我的
        await sql.add(chartList, {
          userId: data.userId,
          friendId: data.friendId,
          lastTime: messageTime,
          lastMessage: data.message,
          messageType: data.messageType,
          messageNum: 0
        })
      }
      // 单聊界面发送
      const emitData = {
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
      if (friend.status != 0) {
        //朋友
        io.to(friend.socketId).emit('singleChart', emitData)
        //朋友
        io.to(friend.socketId).emit('chartList', {
          ...emitListData,
          friendId: data.userId,
          messageNum: friend.messageNum + 1
        })
      }
      //自己
      console.log(socket.id)
      io.to(socket.id).emit('singleChart', emitData)
      //自己
      io.to(socket.id).emit('chartList', {
        ...emitListData,
        friendId: friend.userId,
        messageNum: 0
      })
    } catch (error) {
      console.log('Error:' + error)
    }
  })
}
