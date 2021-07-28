"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Zone Schema
 */
var ZoneSchema = new Schema(
  {
    name: String,
    zoneType: String,
    zoneName: String,
    polygon: Object,
    priceFactor: Number
  },
  { timestamps: true }
);

ZoneSchema.statics.deleteById = function(id) {
  return this.findOneAndDelete({ _id: id }).exec();
};

//find by point
ZoneSchema.statics.findByCoordinates = function(location) {
  return this.findOne({
    polygon: {
      $geoIntersects: { $geometry: { type: "Point", coordinates: location } }
    }
  })
    .sort({ priceFactor: 1 })
    .exec();
};

module.exports = mongoose.model("Zone", ZoneSchema);
