"use strict";
const User = include("models/user");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * User Schema
 */
var CustomerSchema = new Schema(
  {
    customerId: String,
    tokenInfo: String,
    cardId: String,
    lastFour: String,
    expiryMonth: Number,
    expiryYear: Number,
    isValid: { type: Boolean, default: true },
    defaultCard: { type: Boolean, default: false },
    type: String, //visa/master
    user: { type: Schema.Types.ObjectId, index: true, ref: "User" }
  },
  { timestamps: true }
);

CustomerSchema.statics.findByUserId = function(id) {
  return this.find({ user: id, customerId: { $ne: undefined } }).exec();
};

CustomerSchema.statics.findDefaultCard = function(id) {
  return this.findOne({
    user: id,
    customerId: { $ne: undefined },
    default: { $ne: false }
  }).exec();
};

CustomerSchema.statics.findByDriverId = function(id) {
  return this.find({ driver: id }).exec();
};

CustomerSchema.statics.findById = function(id) {
  return this.findOne({ _id: id }).exec();
};

CustomerSchema.statics.deleteCardById = function(id) {
  return this.deleteOne({ _id: id }).exec();
};

CustomerSchema.statics.updateCardById = function(id, def) {
  return this.findOneAndUpdate({ _id: id }, { defaultCard: def }).exec();
};

CustomerSchema.statics.updateCardByUser = function(id) {
  return this.update(
    { user: id },
    { defaultCard: false },
    { multi: true }
  ).exec();
};

module.exports = mongoose.model("Customer", CustomerSchema);
