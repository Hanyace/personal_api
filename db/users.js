const mongoose = require('./db.js')

const Schema = mongoose.Schema

const userSchema = new Schema({
  userId: { type: String }, // 用户id
  userName: { type: String, default: 'esaychat' }, // 用户名
  password: { type: String }, // 密码
  birthday: { type: String, default: '1999-01-01' }, // 生日
  city: { type: String, default: '北京' }, // 城市
  tel: { type: String }, // 手机号
  email: { type: String }, // 邮箱
  avatar: { type: String, default: 'user.png' }, // 头像链接
  status: { type: Number, default: 0 }, // 用户状态  (0:离线,1:在线,2:忙碌,3:隐身)
  isRegister: { type: Boolean, default: false }, // 是否注册
  registerCode: { type: String }, // 注册码
  time: { type: Date, default: Date.now() }, // 注册时间
  socketId: { type: String } // socketId
})

module.exports = mongoose.model('user', userSchema)
