"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * User Schema
 */
var ComplainSchema = new Schema(
  {
    rating: Number,
    comment: String,
    time: Number,
    name: String,
    number: String,
    type: { type: String, default: "complain" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    transporter: { type: Schema.Types.ObjectId, ref: "Transporter" }
  },
  { timestamps: true }
);

ComplainSchema.statics.findByUser = function(profileId) {
  return this.find({ user: profileId })
    .populate("order")
    .sort({ createdAt: -1 })
    .exec();
};

ComplainSchema.statics.findByTransporter = function(profileId) {
  return this.find({ transporter: profileId })
    .populate("order")
    .sort({ createdAt: -1 })
    .exec();
};

ComplainSchema.statics.findByOrder = function(order) {
  return this.find({ order })
    .populate("user")
    .populate("transporter")
    .sort({ createdAt: -1 })
    .exec();
};

ComplainSchema.statics.findByType = function(type) {
  return this.find({ type })
    .populate("user")
    .populate("transporter")
    .sort({ createdAt: -1 })
    .exec();
};

ComplainSchema.statics.findAfterTime = function(time) {
  return this.find({ time: { $gte: time } })
    .populate("user")
    .populate("transporter")
    .populate("order")
    .exec();
};

ComplainSchema.statics.findByTransporterBetweenTime = function(
  transporter,
  start,
  end
) {
  return this.find({
    transporter,
    $and: [{ time: { $gte: start } }, { time: { $lte: end } }]
  }).exec();
};

module.exports = mongoose.model("Complain", ComplainSchema);
