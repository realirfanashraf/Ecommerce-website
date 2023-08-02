const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_details",
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product",
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            },
            total:{type:Number}
        },
    ],
    subTotal: {
        type: Number,
    },
}, { timestamps: true } );

const cart = new mongoose.model("Cart", cartSchema);
module.exports = cart;