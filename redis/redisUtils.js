const client = require('./index')
/**
 * @description: 查询redis中哈希表返回唯一对象
 * @param {String} listName 查询的哈希表名
 * @param {String} key 查询哈希表的键
 * @param {String} findKey 查询的键
 * @param {String} findVal 查询的值
 * @returns {Object} 返回查询到的对象
 */
exports.findFromList = async (listName, key, findKey, findVal) => {
  const list = await client.hGet(listName, key)
  const parseList = JSON.parse(list)
  return parseList.find(item => item[findKey] === findVal)
}

/**
 * @description: 设置redis中哈希表中的某个值
 * @param {String} listName 查询的哈希表名
 * @param {String} key 查询哈希表的键
 * @param {String} findKey 查询的键
 * @param {String} findVal 查询的值
 * @param {String} setKey 设置的键
 * @param {String} setVal 设置的值
 */
exports.setFromList = async (listName, key, findKey, findVal, setKey, setVal) => {
    const list = await client.hGet(listName, key)
    const parseList = JSON.parse(list)
    parseList.find(item => item[findKey] === findVal)[setKey] = setVal
    await client.hSet(listName, key, JSON.stringify(parseList))
}