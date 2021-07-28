"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Zone Schema
 */
var ScheduleSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    name: String,
    date: Date
  },
  { timestamps: true }
);

ScheduleSchema.statics.deleteById = function(id) {
  return this.findOneAndDelete({ _id: id }).exec();
};

ScheduleSchema.statics.findById = function(id) {
  return this.findOne({ _id: id })
    .populate("orders")
    .populate({ path: "orders", populate: { path: "rates" } })
    .populate({ path: "orders", populate: { path: "user" } })
    .exec();
};

ScheduleSchema.statics.findByUser = function(id) {
  return this.findOne({ user: id })
    .populate("orders")
    .populate({ path: "orders", populate: { path: "rates" } })
    .exec();
};

ScheduleSchema.statics.removeOrderForUser = function(userId, orderId) {
  return this.findOneAndUpdate(
    { user: userId },
    { $pull: { orders: orderId } }
  ).exec();
};

module.exports = mongoose.model("Schedule", ScheduleSchema);
