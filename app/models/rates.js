"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Rates Schema
 */
var RatesSchema = new Schema(
  {
    items: [
      {
        item: String,
        size: String,
        service: String,
        quantity: Number,
        shippingPrice: Number,
        order: String
      }
    ],
    total: Number,

    type: String,
    itemType: String,
    mode: String,
    index: Number,
    minWeight: Number,
    maxWeight: Number,
    minLength: Number,
    maxLength: Number,
    minWidth: Number,
    maxWidth: Number,
    minHeight: Number,
    maxHeight: Number,
    minDistance: Number,
    maxDistance: Number,
    price: Number,
    actualPrice: Number,
    actualPriceMin: Number,
    actualPriceMax: Number,
    minPrice: Number,
    maxPrice: Number,
    cancellationPenalty: { typ: Number, default: 0 },
    peakFactor: { type: Number, default: 1 },
    customer: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    calculated: { type: Boolean, default: false },
    addedBy: { type: Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

RatesSchema.statics.findByUserId = function(profileId) {
  return this.findOne({ user: profileId }).exec();
};

RatesSchema.statics.findById = function(id) {
  return this.findOne({ _id: id }).exec();
};

RatesSchema.statics.findByParams = function(params) {
  let query = { type: params.type, active: true };
  //distance
  query.minDistance = { $lte: params.distance / 1000 };
  query.maxDistance = { $gte: params.distance / 1000 };
  //weight
  query.minWeight = { $lte: params.weight };
  query.maxWeight = { $gte: params.weight };
  //width
  query.minWidth = { $lte: params.width };
  query.maxWidth = { $gte: params.width };
  //height
  query.minHeight = { $lte: params.height };
  query.maxHeight = { $gte: params.height };
  //length
  query.minLength = { $lte: params.length };
  query.maxLength = { $gte: params.length };
  console.log(query);
  return this.findOne(query).exec();
};

RatesSchema.statics.updateRatesById = function(id, data) {
  return this.findOneAndUpdate(
    { _id: id },
    {
      $set: data
    },
    { new: true }
  ).exec();
};

RatesSchema.statics.updateRatesByType = function(type, data) {
  const params = {
    minHeight: data.minHeight,
    maxHeight: data.maxHeight,
    minLength: data.minLength,
    maxLength: data.maxLength,
    maxWidth: data.maxWeight,
    minWidth: data.minWidth
  };
  return this.updateMany({ type }, { $set: params }, { multi: true }).exec();
};

RatesSchema.statics.getEarningsReport = function(ids, data) {
  let matchQuery = { _id: { $in: ids } };

  console.log(matchQuery);
  let group = {};
  if (data.period === "yearly") {
    group = {
      _id: {
        year: { $year: "$createdAt" }
      }
    };
  } else if (data.period === "monthly") {
    group = {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      }
    };
  } else if (data.period === "daily") {
    group = {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" }
      }
    };
  }
  console.log(group);

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        ...group,
        total: { $sum: "$price" }
      }
    }
  ]);
};

module.exports = mongoose.model("Rates", RatesSchema);
