const { Schema, model } = require('mongoose');

const JobSchema = new Schema ({
    title: { type: String, required: true },
    subHeading: { type: String, required: true },
    description: { type: String, required: true },
    active: { type: Boolean, default: true }
},
{ timestamps: true }
);

module.exports = model('Job', JobSchema);