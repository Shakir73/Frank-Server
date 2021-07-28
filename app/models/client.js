const { Schema, model } = require('mongoose');

const ClientSchema = new Schema ({
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true
    },
    title: {
        type: String,
        required: true
    },
    decription: {type: String, required: true},
    image: {type: String, required: true},
    active: { type: Boolean, default: true },
    url: String
});

module.exports = model('Client', ClientSchema);