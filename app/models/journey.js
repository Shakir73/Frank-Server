"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * User Schema
 */
var JourneySchema = new Schema(
  {
    origin: Object,
    destination: Object,
    stopOvers: [Object],
    return: Boolean,
    date: Date,
    dates: [Date],
    returnDate: Date,
    returnDates: [Date],
    mode: String,
    frequency: String,
    returnMode: String,
    customRules: { type: Boolean, default: false },
    transporter: { type: Schema.Types.ObjectId, ref: "Transporter" },
    originStation: { type: Schema.Types.ObjectId, ref: "Station" },
    destinationStation: { type: Schema.Types.ObjectId, ref: "Station" }
  },
  { timestamps: true }
);

JourneySchema.statics.findByTransporter = function(profileId, future) {
  let query = { transporter: profileId };
  if (future) {
    query.date = { $gte: new Date() };
  }
  console.log(query);
  return this.find(query)
    .sort({ createdAt: -1 })
    .exec();
};

JourneySchema.statics.updateById = function(id, data) {
  return this.findOneAndUpdate({ _id: id }, { $set: data })
    .populate("order")
    .sort({ createdAt: -1 })
    .exec();
};

JourneySchema.statics.deleteById = function(id, data) {
  return this.deleteOne({ _id: id }).exec();
};

JourneySchema.statics.findNearby = function(location) {
  let params = {};
  const distance = 50;
  let query = [];

  query.push({
    "origin.location": {
      $geoWithin: {
        $centerSphere: [location, distance / 3963.2]
      }
    }
  });
  query.push({
    "destination.location": {
      $geoWithin: {
        $centerSphere: [location, distance / 3963.2]
      }
    }
  });

  params["$or"] = query;

  return this.find(params).exec();
};

JourneySchema.statics.findForLocation = function(location, origin) {
  let params = {};
  const distance = 50;
  let query = [];

  if (origin) {
    query.push({
      "origin.location": {
        $geoWithin: {
          $centerSphere: [location, distance / 3963.2]
        }
      }
    });
  } else {
    query.push({
      "destination.location": {
        $geoWithin: {
          $centerSphere: [location, distance / 3963.2]
        }
      }
    });
  }

  params["$or"] = query;

  return this.find(params)
    .select("transporter")
    .exec();
};

module.exports = mongoose.model("Journey", JourneySchema);
