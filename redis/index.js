const { createClient } = require('redis')


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
  // await client.hSet('userStatus', {
  //   'a': '在线',
  //   'b': '离线',
  // })
  // const userStatus = await client.hGetAll('userStatus')
  // console.log(userStatus.a)
}

connect()

module.exports = client
