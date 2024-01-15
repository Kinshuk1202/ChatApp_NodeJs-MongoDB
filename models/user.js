const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const chat = require('./chat')

const User = new Schema({
    friends:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }]
});
User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);