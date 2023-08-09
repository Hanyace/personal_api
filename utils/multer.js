const multer = require('multer')
const path = require('path')

const file_target = '/image/avatar'

const storage = multer.diskStorage({
  // 设置上传后文件路径，uploads文件夹会自动创建。
  destination: function (req, file, cb) {
    cb(null, './upload' + file_target)
  },
  // 给上传文件重命名，获取添加后缀名
  filename: function (req, file, cb) {
    const fileObj = path.parse(file.originalname)
    cb(null, file.fieldname + '-' + Date.now() + fileObj.ext)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    // 限制文件大小10M
    fileSize: 1024 * 1024 * 10
  },
  // 进度条
  onProgress: function (bytesReceived, bytesExpected) {
    const percent = Math.floor(bytesReceived / bytesExpected * 100)
    console.log(percent)
  },
  // 返回进度
  onFileUploadStart: function (file) {
    console.log(file.originalname + ' is starting ...')
  },
  onFileUploadComplete: function (file) {
    console.log(file.fieldname + ' uploaded to  ' + file.path)
  }
})

module.exports = {
  upload,
  file_target
}
