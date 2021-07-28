const { Schema, model } = require('mongoose');

const ContactSchema = new Schema ({
    firstName: {
        type: String,
        required: [true, 'Please tell us your first name!'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Please tell us your last name!'],
        trim: true,
    },
    company: {
        type: String,
        required: [true, 'Please tell us your company name!'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Please tell us your phone number!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true
    },
    city: String,
    subject: {
        type: String,
        required: [true, 'Please place the subject']
    },
    message: {
        type: String,
        required: [true, 'Please place the description'] },
    accepted: {
        type: Boolean,
        default: false
    }
},
{ timestamps: true }
);

module.exports = model('Contact', ContactSchema);