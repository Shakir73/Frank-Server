"use strict";

const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    policyName: String,
    commissionPayer: String,
    commissionReceiver: String,
    commissionRates: {
        classic: String,
        flex: String,
        green: String,
    },
    paymentCurrency: String,
    paymentMethod: String,
    paymentFrequency: String,
    commissionStartingDate: Date,
    commissionExpiryDate: Date,
    active: {
        type: Boolean,
        default: true
    }
    // store: String
    // store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
},
{ timestamps: true, strict: true }
);

module.exports = mongoose.model('Policy', policySchema);