const { singleChart } = require('./chartting')
const { addFriend, deleteFriend, blacklistFriend } = require('./friendControl')
const { verificationToken } = require('../jwt')
const sql = require('../db/sql')
const user = require('../db/users')

module.exports = function (server) {
  const io = require('socket.io')(server, {
    cors: {
      origin: '*'
    }
  })

  // 监视客户端与服务器的连接
  io.on('connection', async socket => {
    // 验证token
    const token = socket.handshake.auth.token
    // console.log(token);
    try {
      const { userId } = await verificationToken(token)
      try {
        const resUser = (await sql.get(user, { userId }))[0]
        if (resUser.status === 0 || !resUser) {
          console.log('用户未登录')
          socket.disconnect()
          offline(userId)
        } else {
          // 写入socketId 更新用户状态
          await sql.set(user, { userId }, { status: 1, socketId: socket.id })
          console.log(resUser.userName + '已连接')
          console.log('socketId：' + socket.id)
        }
      } catch (error) {
        // 出现错误断开连接
        console.log(error)
        socket.disconnect()
        offline(userId)
      }

      // -------------------- 模块函数 --------------------
      // 单聊监听
      singleChart(socket, io)
      // 添加好友监听
      addFriend(socket, io)
      // 删除好友监听
      deleteFriend(socket, io)
      // 拉黑好友监听
      blacklistFriend(socket, io)

    } catch (error) {
      // 没有token断开连接
      socket.emit('disconnect_msg', {
        message: '缺少token或token无效'
      })
      console.log(error)
      console.log('缺少token或token无效')
      socket.disconnect()
    }
  })
}


// -------------------- utils method --------------------
// 下线改变用户状态
function offline(userId) {
  sql.set(user, { userId }, { status: 0 })
  console.log(userId + '离线')
}