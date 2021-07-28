"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var CommoditySchema = new Schema(
  {
    name: String,
    itemType: { type: Schema.Types.ObjectId, ref: "Category" },
    quantity: Number,
    weight: Number,
    volume: String,
    length: Number,
    width: Number,
    height: Number,
    excluded: { type: Boolean, default: false },
    canReturn: { type: Boolean, default: false },
    maxReturnDays: { type: Number, default: 7 },
    images: [String],
    order: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);

CommoditySchema.statics.findByOrderId = function (id) {
  return this.findOne({ _id: id }).populate("itemType").exec();
};

CommoditySchema.statics.findByItemType = function (id) {
  return this.find({ itemType: id }).exec();
};

CommoditySchema.statics.findByItemTypes = function (ids) {
  return this.find({ itemType: { $in: ids } }).exec();
};

CommoditySchema.statics.updateById = function (id, data) {
  return this.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });
};

module.exports = mongoose.model("Commodity", CommoditySchema);
