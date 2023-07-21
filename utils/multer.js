const multer = require('multer')

const file_target = '/image/avatar'

const upload = multer({ dest: './www' + file_target })

module.exports = {
  upload,
  file_target
}
