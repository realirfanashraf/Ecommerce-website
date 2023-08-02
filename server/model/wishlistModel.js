const mongoose = require("mongoose")

const wishlistSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"user_details",
        require:true
    },
    products:[{
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"product",
            require:true
        },
        quantity:{
            type: Number,
            required: true,
            default: 1,
        }
    }],
    
})

const Wishlist = mongoose.model('wishlists',wishlistSchema)

module.exports = Wishlist