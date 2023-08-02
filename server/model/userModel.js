const mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    phone: {
        type: Number,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    isBlocked: {
        default: false,
        type: Boolean
    },
    address: [{
        name:{type:String,required:true},
        address:{type:String,required:true},
        phone:{type:Number,required:true},
        pincode:{type:Number,required:true},
        city:{type:String,required:true},
        state:{type:String,required:true}
    }],
    coupon: [
        String
    ],
    wallet:{
        type: Number,
        default:0
    }

})

const UserDb = new mongoose.model('user_details', userSchema);

module.exports = UserDb;