"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Zone Schema
 */
var SpaceSchema = new Schema(
  {
    name: String,
    location: Object,
    city: String,
    pictures: [String],
    area: Number,
    floor: String,
    spaceType: String, //home/flat/office/store/warehouse
    schedule: [
      {
        day: String,
        timing: { from: Number, to: Number },
        startTime: String,
        endTime: String,
        open: { type: Boolean, default: false },
      },
    ],
    isPickupPoint: { type: Boolean, default: false },
    canStoreFrozenItems: { type: Boolean, default: false },
    hasShelves: { type: Boolean, default: false },
    canStoreHeavyItems: { type: Boolean, default: false },
    canStoreFlammableItems: { type: Boolean, default: false },
    userType: String, //user/transporter
    user: { type: Schema.Types.ObjectId, ref: "User" },
    transporter: { type: Schema.Types.ObjectId, ref: "Transporter" },
  },
  { timestamps: true }
);

SpaceSchema.index({ location: "2dsphere" });

SpaceSchema.statics.deleteById = function (id) {
  return this.findOneAndDelete({ _id: id }).exec();
};

SpaceSchema.statics.findById = function (id) {
  return this.findOne({ _id: id }).exec();
};

//find by point
SpaceSchema.statics.findByCoordinates = function (location) {
  console.log(location);
  return this.find({
    location: {
      $geoWithin: {
        $centerSphere: [location, 10 / 3963.2],
      },
    },
  });
  // return this.aggregate([
  //   {
  //     $geoNear: {
  //       near: location,
  //       spherical: true,
  //       distanceField: "distance",
  //       includeLocs: "location",
  //       maxDistance: 500 / 3963.2
  //     }
  //   }
  // ]).exec();
};

SpaceSchema.statics.findPickupPointsByCoordinates = function (location) {
  console.log(location);
  return this.find({
    isPickupPoint: true,
    location: {
      $geoWithin: {
        $centerSphere: [location, 10 / 3963.2],
      },
    },
  });
  // return this.aggregate([
  //   {
  //     $geoNear: {
  //       near: location,
  //       spherical: true,
  //       distanceField: "distance",
  //       includeLocs: "location",
  //       maxDistance: 500 / 3963.2
  //     }
  //   }
  // ]).exec();
};

SpaceSchema.statics.findMySpaces = function (user) {
  return this.find({
    $or: [{ user }, { transporter: user }],
  })
    .sort({ priceFactor: 1 })
    .exec();
};

module.exports = mongoose.model("Space", SpaceSchema);
