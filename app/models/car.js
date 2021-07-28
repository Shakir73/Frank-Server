"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CarSchema = new Schema(
  {
    make: String,
    model: String,
    fullName: String,
    length: {
      cm: Number,
      inch: Number,
      feet: Number
    },
    width: {
      cm: Number,
      inch: Number,
      feet: Number
    },
    height: {
      cm: Number,
      inch: Number,
      feet: Number
    },
    capacity: {
      litre: Number,
      cubicInch: Number,
      cubicFeet: Number
    }
  },
  { timestamps: true }
);

CarSchema.statics.markActiveById = function(id) {
  return this.findOneAndUpdate({ _id: id }, { defaultAccount: true });
};

CarSchema.statics.findAll = function(id) {
  return this.find({ user: id });
};

module.exports = mongoose.model("Car", CarSchema);
