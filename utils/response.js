function responseData (code = 200, msg = '成功', data = null, pageInfo = {}) {
  return {
    code,
    data,
    msg,
    pageInfo
  }
}

// 返回结构
module.exports = {
  responseData,
}
