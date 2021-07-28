"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * User Schema
 */
var PromoSchema = new Schema(
  {
    cities: [String],
    deliveryTypes: [String],
    userType: String, //customer/transporter
    text: String,
    code: String,
    global: { type: Boolean, default: false },
    allDeliveryTypes: { type: Boolean, default: false },
    isRestricted: { type: Boolean, default: false },
    expired: { type: Boolean, default: false },
    validFrom: Date,
    validTill: Date,
    discount: Number,
    bonus: Number,
    flatBonus: Number,
    flatDiscount: Number,
    flatRate: Number,
    minApplicableAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    maxBonus: { type: Number, default: 0 },
    fixedPrice: { type: Boolean, default: false },
    usedBy: [{ type: Schema.Types.ObjectId, ref: "User", select: false }],
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

PromoSchema.statics.findByUserId = function(profileId) {
  return this.findOne({ user: profileId }).exec();
};

PromoSchema.statics.findId = function(id) {
  return this.findOne({ _id: id }).exec();
};

PromoSchema.statics.applyPromo = function(userId, code) {
  var date = Math.floor(new Date());
  // var conditions = {"code": code, "usedBy": {$nin : [userId]}};
  var conditions = { code: code.toLowerCase(), expired: false };
  conditions.validFrom = { $lte: date };
  conditions.validTill = { $gte: date };
  // if (carType) {
  //   conditions["$and"] = [{$or: [{carTypes: {$in: [carType]}}, {allCarTypes: true}]}, {$or: [{allowedUsers: {$in: [userId]}}, {isRestricted: false}]}]
  // }

  // conditions.allowedUsers = {$or: [{$in: [userId]}, {isRestricted: false}]}

  return this.findOne(conditions).exec();
};

PromoSchema.statics.applyPromoForTransporter = function(userId, code) {
  var date = Math.floor(new Date());
  // var conditions = {"code": code, "usedBy": {$nin : [userId]}};
  var conditions = {
    code: code.toLowerCase(),
    expired: false,
    userType: "transporter"
  };
  conditions.validFrom = { $lte: date };
  conditions.validTill = { $gte: date };
  // if (carType) {
  //   conditions["$and"] = [{$or: [{carTypes: {$in: [carType]}}, {allCarTypes: true}]}, {$or: [{allowedUsers: {$in: [userId]}}, {isRestricted: false}]}]
  // }

  // conditions.allowedUsers = {$or: [{$in: [userId]}, {isRestricted: false}]}

  return this.findOne(conditions).exec();
};

PromoSchema.statics.findActivePromotions = function(userId) {
  var date = Math.floor(new Date());
  // var conditions = {"code": code, "usedBy": {$nin : [userId]}};
  var conditions = { expired: false };
  conditions.validFrom = { $lte: date };
  conditions.validTill = { $gte: date };
  // if (carType) {
  //   conditions["$and"] = [{$or: [{carTypes: {$in: [carType]}}, {allCarTypes: true}]}, {$or: [{allowedUsers: {$in: [userId]}}, {isRestricted: false}]}]
  // }

  // conditions.allowedUsers = {$or: [{$in: [userId]}, {isRestricted: false}]}

  return this.find(conditions).exec();
};

PromoSchema.statics.getPromo = function(code) {
  var conditions = { code: code };

  return this.findOne(conditions).exec();
};

PromoSchema.statics.updatePromo = function(promoId, userId) {
  return this.update(
    { _id: mongoose.Types.ObjectId(promoId) },
    { $addToSet: { usedBy: userId } }
  );
};

PromoSchema.statics.updateExpiryDate = function(data) {
  return this.update(
    { _id: mongoose.Types.ObjectId(data._id) },
    { validTill: data.validTill },
    { new: true }
  );
};

PromoSchema.statics.expirePromo = function(promoId) {
  return this.update(
    { _id: mongoose.Types.ObjectId(promoId) },
    { expired: true },
    { new: true }
  );
};

PromoSchema.statics.findAll = function() {
  return this.find({}).exec();
};

module.exports = mongoose.model("Promo", PromoSchema);
