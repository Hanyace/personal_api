const nodemailer = require('nodemailer')

const verifyMaile = {
  qq: {
    user: '1245544602@qq.com',
    pass: 'babgwebceyjahjec'
  }
}

// 创建一个SMTP客户端配置
const transporter = nodemailer.createTransport({
  service: 'qq',
  auth: {
    user: verifyMaile.qq.user,
    pass: verifyMaile.qq.pass
  }
})

// 发送邮件
exports.sendMail = (mail, code) => {
  const mailOptions = {
    from: verifyMaile.qq.user, // 发送者,与上面的user一致
    to: mail, // 接收者,可以同时发送多个,以逗号隔开
    subject: '验证码', // 标题
    // text: 'Hello world', // 文本
    html: `<p>
    欢迎注册EasyChat,您的验证码为<b>${code}</b>,请在5分钟内完成注册,如非本人操作请忽略此邮件
    </p>` // html代码
  }
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err)
      return
    }
    console.log('发送成功')
  })
}

