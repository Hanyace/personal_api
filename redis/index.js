const { createClient } = require('redis')
const cron = require('node-cron')

// 创建redis连接
const client = createClient({
  host: 'localhost',
  port: 6379
})

// 监听连接成功事件
client.on('connect', () => {
  console.log('redis连接成功')
})

// 监听准备就绪事件
client.on('ready', () => {
  // console.log('redis准备就绪')
})

// 监听连接失败事件
client.on('error', err => {
  console.log('redis连接失败', err)
})

// 连接
async function connect () {
  await client.connect()
//   await client.rPush('messageList', '1231', (err, res) => {
//     if (err) {
//       console.log(err)
//       return
//     } else {
//       console.log(res)
//     }
//   })
  // sorted set
//   const time = (new Date().getTime()).toString()
  await client.zAdd('cook', {
    score: new Date().getTime(), 
    value: '测试消息'
  }, (err, res) => {
    if (err) {
      console.log(err)
      return
    }
    console.log(res)
  })

  const res = await client.zRange('cook', 0, -1, (err, res) => {
    if (err) {
      console.log(err)
      return
    }
    console.log('zRange')
    console.log(res)
  })

  console.log(res);
}

connect()

module.exports = client
