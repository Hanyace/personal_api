const jwt = require('jsonwebtoken')
const { key } = require('../jwt_key')

module.exports = {
  verificationToken: token => {
   return new Promise((res, rej) => {
      jwt.verify(token, key, (err, decode) => {
        if (!err) {
          res(decode)
        } else {
          rej(err)
        }
      })
    })
  }
}
