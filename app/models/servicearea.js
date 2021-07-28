"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * User Schema
 */
var ServiceAreaSchema = new Schema(
  {
    name: String,
    location: Object,
    polygon: Object,
    type: { type: String, default: "location" },
    transporter: { type: Schema.Types.ObjectId, ref: "Transporter" }
  },
  { timestamps: true }
);

ServiceAreaSchema.statics.findByTransporter = function(profileId) {
  return this.find({ transporter: profileId })
    .sort({ name: 1 })
    .exec();
};

ServiceAreaSchema.statics.findByOrder = function(order) {
  return this.find({ order })
    .populate("user")
    .populate("transporter")
    .sort({ createdAt: -1 })
    .exec();
};

ServiceAreaSchema.statics.findAfterTime = function(time) {
  return this.find({ time: { $gte: time } })
    .populate("user")
    .populate("transporter")
    .populate("order")
    .exec();
};

ServiceAreaSchema.statics.deleteById = function(id) {
  return this.findOneAndDelete({ _id: id }).exec();
};

//findNearby

module.exports = mongoose.model("ServiceArea", ServiceAreaSchema);
