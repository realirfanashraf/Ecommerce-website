const mongoose = require('mongoose');
const { Number } = require('twilio/lib/twiml/VoiceResponse');

var productSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    price: {
        type: Number,
        require: true
    },stock: {
        type: Number,
        require: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        type:String,
        ref: 'category'
    },
    description: {
        type: String,
        require: true
    },
    image: [{
        type: String,
        require: true
    }],
    originalImage: [{
        type: String,
        require: true
    }],
    isBlocked: {
        default: false,
        type: Boolean
    },
    brand: {
        type: String,
        require: true
    }
})

const Product = new mongoose.model('product', productSchema);

module.exports = Product