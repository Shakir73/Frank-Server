"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * User Schema
 */
var ExpenseSchema = new Schema(
  {
    amount: Number,
    reason: String,
    date: Date,
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    transporter: { type: Schema.Types.ObjectId, ref: "Transporter" }
  },
  { timestamps: true }
);

ExpenseSchema.statics.findByUser = function(profileId) {
  return this.find({ user: profileId })
    .populate("order")
    .sort({ createdAt: -1 })
    .exec();
};

ExpenseSchema.statics.findByTransporter = function(profileId) {
  return this.find({ transporter: profileId })
    .populate("order")
    .sort({ createdAt: -1 })
    .exec();
};

ExpenseSchema.statics.findByOrder = function(order) {
  return this.find({ order })
    .sort({ createdAt: -1 })
    .exec();
};

ExpenseSchema.statics.findAfterTime = function(time) {
  return this.find({ time: { $gte: time } })
    .populate("user")
    .populate("transporter")
    .populate("order")
    .exec();
};

ExpenseSchema.statics.findByTransporterBetweenTime = function(
  transporter,
  start,
  end
) {
  return this.find({
    transporter,
    $and: [{ time: { $gte: start } }, { time: { $lte: end } }]
  }).exec();
};

module.exports = mongoose.model("Expense", ExpenseSchema);
