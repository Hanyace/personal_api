const mongoose = require('../mongo')
const Schema = mongoose.Schema

// 聊天信息表
const chartListSchema = new mongoose.Schema({
  userId: { type: String, ref: 'user' }, // 用户id
  friendId: { type: String, ref: 'user' }, // 好友id
  lastMessage: { type: String }, // 最后一条消息
  lastTime: { type: String }, // 最后一条消息时间
  messageNum: { type: Number, default: 0 }, // 未读消息数
  messageType: { type: Number, default: 0 }, // 最后一条消息类型
  isTop: { type: Boolean, default: false }, // 是否置顶
  setTopTime: { type: Date } // 置顶时间
})

module.exports = mongoose.model('chartList', chartListSchema)
