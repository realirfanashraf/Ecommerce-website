const mongoose = require('mongoose');
const { Number } = require('twilio/lib/twiml/VoiceResponse');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_details",
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        total: {
            type: Number,
            required: true,
            min: 0
        },
        statusProduct: {
            type: String,
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Pending'
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    payment_method: {
        type: String,
        enum: ['cod', 'paypal', 'wallet'],
        required:true
    },
    address: {
        type: Object,
        required: true
    }
})


const Order = mongoose.model('order', orderSchema);

module.exports = Order;