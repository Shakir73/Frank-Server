"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema;

/**
 * Tag Schema
 */

var CategorySchema = new Schema(
  {
    active: { type: Boolean, default: true },
    level: { type: Number, default: 0 },
    subCategoryCount: { type: Number, default: 0 },
    priceImpact: { type: Number, default: 0 },
    approved: { type: Boolean, default: true },
    name: String,
    note: String,
    code: Number,
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    description: String,
    rate: { type: Schema.Types.ObjectId, ref: "Rates" },
    parent: { type: Schema.Types.ObjectId, ref: "Category" }
  },
  { timestamps: true }
);

CategorySchema.statics.getAll = function(approvedOnly) {
  var query = { level: 0 };
  if (approvedOnly) {
    query = { level: 0, active: true, approved: { $ne: false } };
  }
  console.log(query);
  return this.find(query)
    .populate("parent")
    .sort("createdAt")
    .exec();
};

CategorySchema.statics.findByParent = function(parent) {
  return this.find({ parent })
    .populate("parent")
    .exec();
};

CategorySchema.statics.findById = function(id) {
  return this.findOne({ _id: id })
    .populate({ path: "parent", populate: { path: "parent" } })
    .exec();
};

CategorySchema.statics.findByName = function(name) {
  return this.findOne({ name }).exec();
};

CategorySchema.statics.search = function(name) {
  return this.find({
    active: true,
    approved: { $ne: false },
    $or: [{ name: { $regex: name, $options: "i" } }]
  })
    .populate({ path: "parent", populate: { path: "parent" } })
    .sort({ level: -1 })
    .exec();
};

CategorySchema.statics.updateRates = function(id, rate) {
  return this.updateMany({}, { active: true }, { multi: true });
};

CategorySchema.statics.updateSubCategoryCount = function(id) {
  return this.findOneAndUpdate({ _id, id }, { $inc: { subCategoryCount: 1 } });
};

CategorySchema.statics.updateById = function(id, data) {
  return this.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });
};

module.exports = mongoose.model("Category", CategorySchema);
