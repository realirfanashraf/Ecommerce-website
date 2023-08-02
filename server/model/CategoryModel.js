const mongoose = require('mongoose');

var categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
},{
    timestamps:true
})

module.exports = mongoose.model("category", categorySchema);