const { Schema, model } = require('mongoose');

const NewsSchema = new Schema ({
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    active: { type: Boolean, default: true }
},
{ timestamps: true }
);

module.exports = model('News', NewsSchema);