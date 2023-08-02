const mongoose = require('../mongo')

const Schema = mongoose.Schema;

const groupMessageSchema = new Schema({
    userId:{type: Schema.Types.ObjectId, ref: 'user'},
    groupName:{type:String},
    data:{type:Object},
    time:{type:Number}
})

module.exports = mongoose.model("groupMessage", groupMessageSchema);