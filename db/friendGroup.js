const mongoose = require('../mongo')
const Schema = mongoose.Schema


// 好友分组表
const friendGroupSchema = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'user' }, // 用户id
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
