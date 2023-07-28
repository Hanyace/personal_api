const mongoose = require('../mongo')

const Schema = mongoose.Schema;

const groupMessageSchema = new Schema({
    userId:{type:String},
    groupName:{type:String},
    data:{type:Object},
    time:{type:Number}
})

module.exports = mongoose.model("groupMessage", groupMessageSchema);