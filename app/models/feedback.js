"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * User Schema
 */
var FeedbackSchema = new Schema(
  {
    comment: String,
    time: Number,
    rating: Number,
    attitude: Number,
    timing: Number,
    delivery: Number,
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    transporter: { type: Schema.Types.ObjectId, ref: "Transporter" }
  },
  { timestamps: true }
);

FeedbackSchema.statics.findByUser = function(profileId) {
  return this.find({ user: profileId })
    .populate("order")
    .sort({ createdAt: -1 })
    .exec();
};

FeedbackSchema.statics.findByTransporter = function(profileId) {
  return this.find({ transporter: profileId })
    .populate("order")
    .sort({ createdAt: -1 })
    .exec();
};

FeedbackSchema.statics.findByOrder = function(order) {
  return this.find({ order })
    .populate("user")
    .populate("transporter")
    .sort({ createdAt: -1 })
    .exec();
};

FeedbackSchema.statics.findAfterTime = function(time) {
  return this.find({ time: { $gte: time } })
    .populate("user")
    .populate("transporter")
    .populate("order")
    .exec();
};

FeedbackSchema.statics.findByTransporterBetweenTime = function(
  transporter,
  start,
  end
) {
  return this.find({
    transporter,
    $and: [{ time: { $gte: start } }, { time: { $lte: end } }]
  }).exec();
};

module.exports = mongoose.model("Feedback", FeedbackSchema);
