const sql = require('../db/sql')
const user = require('../db/users')
const friendList = require('../db/friendList')
const chartList = require('../db/chartList')

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

// 添加好友验证
exports.addFriend = (socket, io) => {
  socket.on('addFriend', async data => {
    const time = new Date().getTime()
    const { userId, friendId, friendGroup = 0, addMessage } = data
    // 缺少id
    if (!userId || !friendId) {
      io.to(socket.id).emit('friendControl', {
        type: 8,
        message: '缺少id'
      })
      return
    }
    if (userId === friendId) {
      // 给自己发送添加动作
      io.to(socket.id).emit('friendControl', {
        type: 8,
        message: '不能添加自己为好友'
      })
      return
    }
    const friend = await sql.getOne(user, { userId: friendId })
    if (!friend) {
      // 没有这个用户
      io.to(socket.id).emit('friendControl', {
        type: 8,
        message: '没有查询到此用户'
      })
      return
    }
    // 查询是之前是否添加过
    const hasfriend = (await sql.get(friendList, { userId, friendId }))[0]
    if (hasfriend) {
      // 之前添加过
      // 判断是否已经是好友
      if (hasfriend.friendType === 1) {
        // 已经是好友
        // 给自己发送已经是好友了
        io.to(socket.id).emit('friendControl', {
          type: 6
        })
        return
      } else if (hasfriend.friendType === 0) {
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
        const hasUser = (
          await sql.get(friendList, { userId: friendId, friendId: userId })
        )[0]
        hasUser.addMessage.push({
          message: addMessage,
          time,
          type: 1
        })
        await sql.set(
          friendList,
          { userId: friendId, friendId: userId },
          { addMessage: hasUser.addMessage }
        )

        // 判断是否在线
        const friend = await sql.getOne(user, { userId: friendId })
        if ( friend.status != 0) {
          // 好友在线
          // 发送验证消息
          io.to(friend.socketId).emit('friendControl', {
            userId: friend.userId,
            friendId: userId,
            friendGroup,
            friendTime: time,
            type: 1,
            addMessage: hasUser.addMessage
          })
        }
        // 给自己发送添加动作成功消息
        io.to(socket.id).emit('friendControl', {
          userId,
          friendId,
          friendGroup,
          friendTime: time,
          type: 0,
          addMessage: hasfriend.addMessage
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
        const hasUser = (
          await sql.get(friendList, { userId: friendId, friendId: userId })
        )[0]
        hasUser.addMessage.push({
          message: addMessage,
          time,
          type: 1
        })
        // 更新朋友的好友表
        await sql.set(
          friendList,
          { userId: friendId, friendId: userId },
          { friendType: 1, friendTime: time, addMessage: hasUser.addMessage }
        )
        // 判断是否在线
        if (friend.status != 0) {
          // 好友在线
          // 发送验证消息
          io.to(friend.socketId).emit('friendControl', {
            userId: friend.userId,
            friendId: userId,
            friendGroup,
            friendTime: time,
            type: 7,
            addMessage: hasUser.addMessage
          })
        }
        // 给自己发送添加动作成功消息
        io.to(socket.id).emit('friendControl', {
          userId,
          friendId,
          friendGroup,
          friendTime: time,
          type: 7,
          addMessage: hasfriend.addMessage
        })
        return
      } else if (hasfriend.friendType === 3) {
        // 之前被拉黑过
        // 给自己发送添加动作
        io.to(socket.id).emit('friendControl', {
          type: 8,
          message: '你已经被对方拉黑,无法添加好友'
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
        addMessage: addMessage ? [{ message: addMessage, time, type: 0 }] : []
      })
      // 好友的好友列表(默认被添加)
      await sql.add(friendList, {
        userId: friendId,
        friendId: userId,
        friendGroup,
        friendTime: time,
        friendType: 2,
        addMessage: addMessage ? [{ message: addMessage, time, type: 1 }] : []
      })

      // 判断是否在线
      const friend = (await sql.get(user, { userId: friendId }))[0]
      if (friend.status != 0) {
        // 好友在线
        // 发送验证消息
        io.to(friend.socketId).emit('friendControl', {
          userId: friend.userId,
          friendId: userId,
          friendGroup,
          friendTime: time,
          type: 1,
          addMessage: addMessage ? [{ message: addMessage, time, type: 1 }] : []
        })
      }
      // 给自己发送添加动作成功消息
      io.to(socket.id).emit('friendControl', {
        userId,
        friendId,
        friendGroup,
        friendTime: time,
        type: 0,
        addMessage: addMessage ? [{ message: addMessage, time, type: 0 }] : []
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
        message: '缺少id'
      })
      return
    }
    // 原本不是好友
    const hasfriend = (await sql.get(friendList, { userId, friendId }))[0]
    if (!hasfriend) {
      io.to(socket.id).emit('friendControl', {
        type: 9,
        message: 'TA还不是你的好友'
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
        message: '删除成功'
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
                message: '缺少id'
            })
            return
        }
        // 原本不是好友
        const hasfriend = (await sql.get(friendList, { userId, friendId }))[0] 
        if (!hasfriend) {
            io.to(socket.id).emit('friendControl', {
                type: 10,
                message: 'TA还不是你的好友'
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
            message: '拉黑成功'
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
                message: '缺少id'
            })
            return
        }
        // 已经是好友
        const hasfriend = await sql.getOne(friendList, { userId, friendId,friendType:1 })
        if (hasfriend) {
            io.to(socket.id).emit('friendControl', {
                type: 11,
                message: 'TA已经是你的好友'
            })
            return
        }
        // 执行通过
        // 我的
        await sql.set(friendList, { userId, friendId }, { friendType: 1 })
        // 好友的
        await sql.set(friendList, { userId: friendId, friendId: userId }, { friendType: 1 })
        // 给自己发送通过成功消息
        io.to(socket.id).emit('friendControl', {
            type: 7,
            message: '通过成功'
        })
    })
}