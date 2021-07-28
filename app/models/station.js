"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Zone Schema
 */
var StationSchema = new Schema(
  {
    name: String,
    city: String,
    state: String,
    country: String,
    icao: String,
    code: String,
    type: String, //airport, seaport, train,
    location: Object
  },
  { timestamps: true }
);

StationSchema.statics.deleteById = function(id) {
  return this.findOneAndDelete({ _id: id }).exec();
};

//find by point
StationSchema.statics.findByLocation = function(location, type) {
  let query = {
    location: {
      $geoWithin: {
        $centerSphere: [location, 25 / 3963.2]
      }
    }
  };
  if (type) {
    if (type == "air") {
      query.type = "airport";
    } else if (type == "sea") {
      query.type = "seaport";
    } else if (type == "train") {
      query.type = "train";
    }
  }
  return this.find(query).exec();
};

StationSchema.statics.findByCity = function(city) {
  let query = {};
  if (city) {
    query["$or"] = [
      { city: { $regex: city, $options: "i" } },
      { state: { $regex: city, $options: "i" } },
      { country: { $regex: city, $options: "i" } },
      { name: { $regex: city, $options: "i" } },
      { icao: { $regex: city, $options: "i" } }
    ];
  }
  return this.find(query).exec();
};

module.exports = mongoose.model("Station", StationSchema);
