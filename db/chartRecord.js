const mongoose = require('../mongo');
const Schema = mongoose.Schema;


// 聊天记录表
const chartRecordSchema = new mongoose.Schema({
    userId: { type: String, ref: 'user' }, // 用户id
    friendId: { type: String, ref: 'user' }, // 好友id
    message: { type: String }, // 消息内容
    messageType: { type: Number }, // 消息类型 (0:文本,1:图片,2:文件,3:视频,4:音频,5:表情,6:链接)
    messageTime: { type: Date }, // 消息时间
    messageStatus: { type: Number }, // 消息状态 (0:已读,1:未读,2:撤回,3:删除,4:拦截)
})

module.exports = mongoose.model('chartRecord', chartRecordSchema)