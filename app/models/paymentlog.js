"use strict";
const User = include("models/user");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * User Schema
 */
var PaymentLogSchema = new Schema(
  {
    amount: String,
    currency: String,
    paymentId: String,
    ip: String,
    desc: String,
    success: Boolean,
    order: { type: Schema.Types.ObjectId, index: true, ref: "Order" },
    user: { type: Schema.Types.ObjectId, index: true, ref: "User" },
    transporter: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: "Transporter"
    }
  },
  { timestamps: true }
);

PaymentLogSchema.statics.findByUserId = function(id) {
  return this.find({ user: id, amount: { $ne: undefined } })
    .populate("description")
    .exec();
};

PaymentLogSchema.statics.findByDriverId = function(id) {
  return this.find({ driver: id }).exec();
};

module.exports = mongoose.model("PaymentLog", PaymentLogSchema);
