const mongoose = require('../mongo')

const Schema = mongoose.Schema

const userSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'user' }, // 用户id
  userName: { type: String }, // 用户名
  password: { type: String }, // 密码
  birthday: { type: String, default: '1999-01-01' }, // 生日
  age: { type: Number, default: 0 }, // 年龄
  sex: { type: Number, default: 0 }, // 性别 (0:男,1:女)
  city: { type: String, default: '北京' }, // 城市
  tel: { type: String }, // 手机号
  email: { type: String }, // 邮箱
  avatar: { type: String, default: 'user.png' }, // 头像链接
  discription: { type: String, default: '这个人很懒,什么都没有留下' }, // 个性签名
  status: { type: Number, default: 0 }, // 用户状态  (0:离线,1:在线,2:忙碌,3:隐身)
  isRegister: { type: Boolean, default: false }, // 是否注册
  registerCode: { type: String }, // 注册码
  time: { type: Date, default: Date.now() }, // 注册时间
  socketId: { type: String } // socketId
})

userSchema.index({_id: 1}, { unique: true })

module.exports = mongoose.model('user', userSchema)
