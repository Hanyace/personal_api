const sql = require('../db/sql')
const user = require('../db/users')
const friendList = require('../db/friendList')
const chartList = require('../db/chartList')
const client = require('../redis')
const { findFromList } = require('../redis/redisUtils')

// 规定返回的Type
// 0.主动添加
// 1.被添加
// 2.删除好友
// 3.拉黑好友
// 4.修改好友分组
// 5.修改好友备注
// 6.已经是好友了
// 7.通过验证
// 8.添加错误
// 9.删除错误
// 10.拉黑错误
// 11.通过分组错误
// 12.被通过验证
// 13.回复验证消息

// 添加好友验证
exports.addFriend = (socket, io) => {
  socket.on('addFriend', async data => {
    const time = new Date().getTime()
    const { userId, friendId, friendGroup = 0, addMessage } = data
    // 缺少id
    if (!userId || !friendId) {
      io.to(socket.id).emit('friendControl', {
        type: 8,
        message: '没有收到好友id哦~'
      })
      return
    }
    if (userId === friendId) {
      // 给自己发送添加动作
      io.to(socket.id).emit('friendControl', {
        type: 8,
        message: '不能添加自己为好友啦~'
      })
      return
    }
    const friend = await sql.getOne(user, { _id: friendId })
    const userInfo = await sql.getOne(user, { _id: userId })
    if (!friend) {
      // 没有这个用户
      io.to(socket.id).emit('friendControl', {
        type: 8,
        message: '没有查询到此用户哦~'
      })
      return
    }
    const isOnline = await client.hGet('userSatatus', friendId)
    const friendSocketId = await client.hGet('socketId', friendId)
    // 查询是之前是否添加过
    const hasfriend = await findFromList(
      'friendList',
      userId,
      'friendId',
      friendId
    )
    if (hasfriend) {
      // 之前添加过
      // 判断是否已经是好友
      if (hasfriend.friendType == 1) {
        // 已经是好友
        // 给自己发送已经是好友了
        io.to(socket.id).emit('friendControl', {
          type: 6,
          message: '已经是好友啦~'
        })
        return
      } else if (hasfriend.friendType == 0) {
        // 之前添加过但是还未通过
        hasfriend.addMessage.push({
          message: addMessage,
          time,
          type: 0
        })
        // 更新验证消息
        await sql.set(
          friendList,
          { userId, friendId },
          { addMessage: hasfriend.addMessage }
        )
        // 更新朋友的验证消息
        const hasUser = await sql.getOne(friendList, {
          userId: friendId,
          friendId: userId
        })
        hasUser.addMessage.push({
          message: addMessage,
          time,
          type: 1
        })
        await sql.set(
          friendList,
          { userId: friendId, friendId: userId },
          { addMessage: hasUser.addMessage,  isView: false }
        )

        // 判断是否在线
        // 使用redis判断是否在线
        const isOnline = await client.hGet('userSatatus', friendId)
        const friendSocketId = await client.hGet('socketId', friendId)
        if (isOnline != 0) {
          // 好友在线
          // 发送验证消息
          io.to(friendSocketId).emit('friendControl', {
            userId: friendId,
            friendId: userId,
            friendGroup,
            friendTime: time,
            addMessage: hasUser.addMessage,
            avatar: userInfo.avatar,
            username: userInfo.userName,
            type: 1
          })
        }
        // 给自己发送添加动作成功消息
        io.to(socket.id).emit('friendControl', {
          userId,
          friendId,
          friendGroup,
          friendTime: time,
          addMessage: hasfriend.addMessage,
          avatar: friend.avatar,
          username: friend.userName,
          type: 0
        })
      } else if (hasfriend.friendType === 2) {
        // 之前被添加过
        // 更新好友表
        hasfriend.addMessage.push({
          message: addMessage,
          time,
          type: 0
        })
        await sql.set(
          friendList,
          { userId, friendId },
          {
            friendType: 1,
            friendTime: time,
            friendGroup,
            addMessage: hasfriend.addMessage
          }
        )
        const hasUser = await sql.getOne(friendList, {
          userId: friendId,
          friendId: userId
        })

        hasUser.addMessage.push({
          message: addMessage,
          time,
          type: 1
        })
        // 更新朋友的好友表
        await sql.set(
          friendList,
          { userId: friendId, friendId: userId },
          { friendType: 1, friendTime: time, addMessage: hasUser.addMessage, isView: false }
        )
        // 判断是否在线
        if (isOnline != 0) {
          // 好友在线
          // 发送验证消息
          io.to(friendSocketId).emit('friendControl', {
            userId: friend.userId,
            friendId: userId,
            friendGroup,
            friendTime: time,
            addMessage: hasUser.addMessage,
            avatar: userInfo.avatar,
            username: userInfo.userName,
            type: 7
          })
        }
        // 给自己发送添加动作成功消息
        io.to(socket.id).emit('friendControl', {
          userId,
          friendId,
          friendGroup,
          friendTime: time,
          addMessage: hasfriend.addMessage,
          avatar: friend.avatar,
          username: friend.userName,
          type: 7
        })
        return
      } else if (hasfriend.friendType === 3) {
        // 之前被拉黑过
        // 给自己发送添加动作
        io.to(socket.id).emit('friendControl', {
          type: 8,
          message: '你已经被对方拉黑,无法添加好友哦~'
        })
        return
      }
    } else {
      // 添加好友表(默认未添加)
      // 我的好友列表
      await sql.add(friendList, {
        userId,
        friendId,
        friendGroup,
        friendTime: time,
        addMessage: addMessage ? [{ message: addMessage, time, type: 0 }] : [],
        isView: true
      })
      // 好友的好友列表(默认被添加)
      await sql.add(friendList, {
        userId: friendId,
        friendId: userId,
        friendGroup,
        friendTime: time,
        friendType: 2,
        addMessage: addMessage ? [{ message: addMessage, time, type: 1 }] : [],
        isView: false
      })

      // 判断是否在线
      const friend = (await sql.get(user, { _id: friendId }))[0]
      if (isOnline != 0) {
        // 好友在线
        // 发送验证消息
        io.to(friendSocketId).emit('friendControl', {
          userId: friend.userId,
          friendId: userId,
          friendGroup,
          friendTime: time,
          addMessage: addMessage
            ? [{ message: addMessage, time, type: 1 }]
            : [],
          type: 1,
          avatar: userInfo.avatar,
          username: userInfo.userName
        })
      }
      // 给自己发送添加动作成功消息
      io.to(socket.id).emit('friendControl', {
        userId,
        friendId,
        friendGroup,
        friendTime: time,
        addMessage: addMessage ? [{ message: addMessage, time, type: 0 }] : [],
        type: 0,
        avatar: friend.avatar,
        username: friend.userName
      })
    }
  })
}

// 删除好友
exports.deleteFriend = (socket, io) => {
  socket.on('deleteFriend', async data => {
    const { userId, friendId } = data
    // 缺少id
    if (!userId || !friendId) {
      io.to(socket.id).emit('friendControl', {
        type: 9,
        message: '没有收到好友id哦~'
      })
      return
    }
    // 原本不是好友
    const hasfriend = (await sql.get(friendList, { userId, friendId }))[0]
    if (!hasfriend) {
      io.to(socket.id).emit('friendControl', {
        type: 9,
        message: 'TA还不是你的好友哦~'
      })
      return
    }
    // 执行删除
    // 我的
    await sql.remove(friendList, { userId, friendId })
    // 好友的
    await sql.remove(friendList, { userId: friendId, friendId: userId })
    // 剔除聊天表
    // 我的
    await sql.remove(chartList, { userId, friendId })
    // 好友的
    await sql.remove(chartList, { userId: friendId, friendId: userId })
    // 还可以删除聊天记录,但实际上数据库不会删除记录,只是不会显示
    // 给自己发送删除成功消息
    io.to(socket.id).emit('friendControl', {
      type: 2,
      message: '删除成功啦!'
    })
  })
}

// 拉黑好友
exports.blacklistFriend = (socket, io) => {
  socket.on('blacklistFriend', async data => {
    const { userId, friendId } = data
    // 缺少id
    if (!userId || !friendId) {
      io.to(socket.id).emit('friendControl', {
        type: 10,
        message: '没有收到好友id哦~'
      })
      return
    }
    // 原本不是好友
    const hasfriend = await sql.getOne(friendList, { userId, friendId })
    if (!hasfriend) {
      io.to(socket.id).emit('friendControl', {
        type: 10,
        message: 'TA还不是你的好友哦~'
      })
      return
    }
    // 执行拉黑
    // 我的
    await sql.set(friendList, { userId, friendId }, { friendType: 3 })
    // 好友的不用执行拉黑
    // 给自己发送拉黑成功消息
    io.to(socket.id).emit('friendControl', {
      type: 3,
      message: '拉黑成功!'
    })
  })
}

// 通过验证
exports.passFriend = (socket, io) => {
  socket.on('passFriend', async data => {
    const { userId, friendId } = data
    // 缺少id
    if (!userId || !friendId) {
      io.to(socket.id).emit('friendControl', {
        type: 11,
        message: '没有收到好友id哦~'
      })
      return
    }
    // 已经是好友
    const hasfriend = await sql.getOne(friendList, {
      userId,
      friendId,
      friendType: 1
    })
    if (hasfriend) {
      io.to(socket.id).emit('friendControl', {
        type: 11,
        message: 'TA已经是你的好友哦~'
      })
      return
    }
    // 执行通过
    // 我的
    await sql.set(friendList, { userId, friendId }, { friendType: 1 })
    // 加入聊天表
    await sql.add(chartList, { userId, friendId, lastMessage: '', lastTime: 0 })
    // 好友的
    await sql.set(
      friendList,
      { userId: friendId, friendId: userId },
      { friendType: 1, isView: false }
    )
    // 加入聊天表
    await sql.add(chartList, {
      userId: friendId,
      friendId: userId,
      lastMessage: '',
      lastTime: 0
    })
    // 给自己发送通过成功消息
    io.to(socket.id).emit('friendControl', {
      type: 7,
      message: '哇哦,通过成功啦!'
    })
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
    // 好友在线
    const isOnline = await client.hGet('userSatatus', friendId)
    const friendSocketId = await client.hGet('userSocketId', friendId)
    if (isOnline != 0) {
      // 发送通过成功消息
      io.to(friendSocketId).emit('friendControl', {
        type: 12,
        message: '有人通过好友请求啦!'
      })
    }
  })
}

// 拒绝验证
exports.refuseFriend = (socket, io) => {
  socket.on('refuseFriend', async data => {
    const { userId, friendId } = data
    // 缺少id
    if (!userId || !friendId) {
      io.to(socket.id).emit('friendControl', {
        type: 11,
        message: '没有收到好友id哦~'
      })
      return
    }
    const time = new Date().getTime()
    // 执行拒绝
    // 我的
    await sql.set(friendList, { userId, friendId }, { friendType: 4 })
    // 好友
    await sql.set(
      friendList,
      { userId: friendId, friendId: userId },
      { friendType: 5, isView: false }
    )
    // 给自己发送拒绝成功消息
    io.to(socket.id).emit('friendControl', {
      message: '拒绝成功!',
      type: 4
    })
    // 好友在线
    const isOnline = await client.hGet('userSatatus', friendId)
    const friendSocketId = await client.hGet('userSocketId', friendId)
    if (isOnline != 0) {
      // 发送拒绝成功消息
      io.to(friendSocketId).emit('friendControl', {
        message: '啊哦,有人拒绝了你的好友请求哦~',
        type: 13
      })
    }
  })
}

//  回复验证
exports.replyFriend = (socket, io) => {
  socket.on('replyFriend', async data => {
    const { userId, friendId, message } = data
    // 缺少id
    if (!userId || !friendId) {
      io.to(socket.id).emit('friendControl', {
        type: 11,
        message: '没有收到好友id哦~'
      })
      return
    }
    const time = new Date().getTime()
    // 查询原来的消息
    const friendData = await sql.getOne(friendList, {
      userId: friendId,
      friendId: userId
    })
    const addMessage = friendData.addMessage
    addMessage.push({
      message,
      time,
      type: 0
    })
    // 执行回复
    // 我的
    await sql.set(friendList, { userId, friendId }, { addMessage })
    // 好友
    await sql.set(
      friendList,
      { userId: friendId, friendId: userId },
      { addMessage: {
        ...addMessage,
        type: 0
      }, isView: false }
    )
    // 给自己发送回复成功消息
    io.to(socket.id).emit('friendControl', {
      message: '回复成功!',
      type: 13
    })
    // 好友在线
    const isOnline = await client.hGet('userSatatus', friendId)
    const friendSocketId = await client.hGet('userSocketId', friendId)
    if (isOnline != 0) {
      // 发送回复成功消息
      io.to(friendSocketId).emit('friendControl', {
        message: '有人回复了你的好友请求哦~',
        type: 13
      })
    }
  })
}
