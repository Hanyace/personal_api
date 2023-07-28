const mongoose = require('../mongo')

// 好友分组表
const friendGroupSchema = new mongoose.Schema({
  userId: { type: String, ref: 'user' }, // 用户id
  friendGroup: {
    type: Array,
    default: [
      {
        name: '我的好友',
        index: 0
      }
    ]
  } // 分组
})

module.exports = mongoose.model('friendGroup', friendGroupSchema)
