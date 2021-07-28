const mongoose = require('mongoose');

const PlatformSchema = new mongoose.Schema({
    platform: String,
    productId: String,
    name: String,
    dimensions: {
        width: Number,
        height: Number,
        depth: Number,
        weight: Number
    },
    price: Number,
    store: String
},
{ timestamps: true, strict: true }
);

module.exports = mongoose.model('Platform', PlatformSchema);