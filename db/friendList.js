const mongoose = require('../mongo')
const Schema = mongoose.Schema

// 好友表
const friendSchema = new mongoose.Schema({
  userId: { type: String, ref: 'user' }, // 用户id
  friendId: { type: String, ref: 'user' }, // 好友id
  friendGroup: { type: Number, default: 0 }, // 好友分组 (0:默认分组)
  friendType: { type: Number, default: 0 }, // 好友类型 (0:待添加,1:已添加,2:被添加,3:已拉黑，4:已拒绝,5:被拒绝)
  friendTime: { type: Date }, // 好友添加时间
  addMessage: { type: Array, default: [] }, // 添加好友验证消息
  isView: { type: Boolean, default: false }, // 是否查看
})

module.exports = mongoose.model('friend', friendSchema)
//(0:待添加,1:已添加,2:被添加,3:已拉黑，4:已拒绝,5:被拒绝)