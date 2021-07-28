"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Zone Schema
 */
var StaticSchema = new Schema(
  {
    faqs: [
      { question: String, answer: String, options: [String], type: String },
    ],
    businessSectors: [String],
  },
  { timestamps: true }
);

StaticSchema.statics.deleteById = function (id) {
  return this.findOneAndDelete({ _id: id }).exec();
};

StaticSchema.static.addFAQ = function (data) {
  return this.update({}, { $addToSet: { faqs: data } });
};

StaticSchema.static.addBusinessSector = function (business) {
  return this.update({}, { $addToSet: { businessSectors: business } });
};

module.exports = mongoose.model("Static", StaticSchema);
