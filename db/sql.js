const sql = {
  // 添加
  add: (colName, data) => {
    return new Promise((resolve, reject) => {
      colName.insertMany(data, err => {
        if (err) {
          reject(err)
        } else {
          resolve('添加成功')
        }
      })
    })
  },

  // 删除
  remove: (colName, where, num = 1) => {
    return new Promise((resolve, reject) => {
      type = num == 1 ? 'deleteOne' : 'deleteMany'
      colName[type](where, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  },

  // 修改
  set: (colName, where, data, num = 1) => {
    return new Promise((resolve, reject) => {
      type = num == 1 ? 'updateOne' : 'updateMany'
      colName[type](where, {$set: data}, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  },

  // 查询
  get: (colName, where = {}, sort = {}, mode = { __v: 0}) => {
    return new Promise((resolve, reject) => {
      colName.find(where, mode, { sort }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  },

  // 查询单个
  getOne: (colName, where = {}, sort = {}, mode = { __v: 0}) => {
    return new Promise((resolve, reject) => {
      colName.findOne(where, mode, { sort }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  },

  // 联表查询
  /**
   * 
   * @param {Object} colName 集合
   * @param {Object} where 筛选条件
   * @param {string} fromCol 联表的集合
   * @param {string} localField 集合关联的键
   * @param {string} foreignField 联表集合关联的键
   * @param {string} as 新键名称
   * @returns 
   */
  aggregate: (colName, where = {}, fromCol, localField , foreignField, as) => {
    return new Promise((resolve, reject) => {
      colName.aggregate([
        {
          $lookup: {
            from: fromCol,
            localField,
            foreignField,
            as
          },
        },
        {
          $match: where
        }
      ], (err, data) => {
        if (err) {
          reject(err)
        } else {
          data = JSON.parse(JSON.stringify(data))
          resolve(data)
        }
      }
    )
  })
  },

  // 分页查询
  getLimitSkip: (
    colName,
    where,
    sort = {},
    num = 5,
    page = 1,
    mode = { __v: 0 }
  ) => {
    return new Promise((resolve, reject) => {
      colName
        .find(where, mode)
        .sort(sort)
        .limit(num)
        .skip((page - 1) * num)
        .exec((err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
    })
  },
  
}




module.exports = sql
