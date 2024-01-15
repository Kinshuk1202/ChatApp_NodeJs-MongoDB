const mongoose = require('mongoose')
const User = require('./user')
const chatSchema = new mongoose.Schema({
    windowName:{
        type:String,
        required:true
    },
    messages:[{
        msg:String,
        user_id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    }]
})

module.exports  = mongoose.model('Chat', chatSchema)
