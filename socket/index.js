const { singleChart } = require('./chartting')
const {
  addFriend,
  deleteFriend,
  blacklistFriend,
  passFriend,
  refuseFriend,
  replyFriend,
  viewFriend,
} = require('./friendControl')
const { verificationToken } = require('../jwt')
const sql = require('../db/sql')
const user = require('../db/users')
const client = require('../redis')
const {
  writeFriendList,
  writeUserInfo,
  writeChartList,
  writeChartListToDB,
  writeChartRecordToDB
} = require('../redis/unloading')

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
      const { _id } = await verificationToken(token)
      console.log('id' + _id)
      try {
        const resUser = (await sql.get(user, { _id }))[0]
        if (resUser.status === 0 || !resUser) {
          console.log('用户未登录')
          socket.disconnect()
          await offline(_id)
        } else {
          // 写入socketId 更新用户状态
          // await sql.set(user, { userId }, { status: 1, socketId: socket.id })

          // 写入redisuserSatatus
          await online(_id, socket.id)
          console.log(resUser.userName + '已连接')
          console.log('socketId：' + socket.id)
        }
      } catch (error) {
        // 出现错误断开连接
        console.log(error)
        socket.disconnect()
        await offline(_id)
      }

      // 监听断开连接
      socket.on('disconnect', async () => {
        const resUser = await sql.getOne(user, { _id })
        console.log(resUser.userName + '断开连接')
        await offline(_id)
      })

      // -------------------- 模块函数 --------------------
      // 单聊监听
      singleChart(socket, io)
      // 添加好友监听
      addFriend(socket, io)
      // 删除好友监听
      deleteFriend(socket, io)
      // 拉黑好友监听
      blacklistFriend(socket, io)
      // 通过好友监听
      passFriend(socket, io)
      // 拒绝好友监听
      refuseFriend(socket, io)
      // 回复好友监听
      replyFriend(socket, io)
      // 查看好友监听
      viewFriend(socket, io)
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
async function offline (userId) {
  await client.hSet('userSatatus', userId, 0)
  await client.hDel('socketId', userId)
  await writeChartListToDB(userId)
  await writeChartRecordToDB(userId)
  console.log(userId + '离线')
}

// 上线改变用户状态
async function online (userId, socketId) {
  await client.hSet('socketId', userId, socketId)
  await client.hSet('userSatatus', userId, 1)
  await writeUserInfo(userId)
  await writeFriendList(userId)
  await writeChartList(userId)
}
