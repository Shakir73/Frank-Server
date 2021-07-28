"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * User Schema
 */
var RankSchema = new Schema(
  {
    rank: String,
    level: { type: Number, default: 1 }
  },
  { timestamps: true }
);

RankSchema.statics.findAll = function(profileId) {
  return this.find({ transporter: profileId })
    .populate("order")
    .sort({ createdAt: -1 })
    .exec();
};

RankSchema.statics.findByTransporter = function(profileId) {
  return this.find({ transporter: profileId })
    .populate("order")
    .sort({ createdAt: -1 })
    .exec();
};

module.exports = mongoose.model("Rank", RankSchema);
