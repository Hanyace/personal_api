const sql = require('../db/sql')
const user = require('../db/users')
const chartRecord = require('../db/chartRecord')
const chartList = require('../db/chartList')
const friendList = require('../db/friendList')
const client = require('../redis')
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
      const isFrind = friendList.find(item => item.friendId === data.friendId)
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
            messageNum: messageNum
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
            messageNum: 0
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
            userId: data.friendId,
            friendId: data.userId,
            lastTime: messageTime,
            lastMessage: data.message,
            messageType: data.messageType,
            messageNum: 1
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
            userId: data.userId,
            friendId: data.friendId,
            lastTime: messageTime,
            lastMessage: data.message,
            messageType: data.messageType,
            messageNum: 0
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
      const isOnline = await client.hGet('userSatatus', friendId)
      const friendSocketId = await client.hGet('userSocketId', friendId)
      if (isOnline != 0) {
        //朋友
        io.to(friendSocketId).emit('singleChart', emitData)
        //朋友
        io.to(friendSocketId).emit('chartList', {
          ...emitListData,
          friendId: data.userId,
          messageNum: friend.messageNum + 1
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
