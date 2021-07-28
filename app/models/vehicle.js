"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const VehicleSchema = new Schema(
  {
    mode: String,
    make: String,
    model: String,
    color: String,
    bodyType: String,
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    numberPlate: String,
    information: String,
    documents: [String],
    numberPlatePicture: [String],
    vehiclePictures: [String],
    flightNumber: String,
    airline: String,
    drivers: [
      {
        type: Schema.Types.ObjectId,
        index: true,
        ref: "Transporter",
      },
    ],
    transporter: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: "Transporter",
    },
    carrySuitcase: { type: Boolean, default: true },
    carryBox: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    approved: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    expired: { type: Boolean, default: false },
    private: { type: Boolean, default: true }, // Private key added to select mode (private or public method)
  },
  { timestamps: true }
);

VehicleSchema.pre(/^find/, function(next){
  this.find({ deleted: { $ne: true } });
  next();
});

VehicleSchema.statics.deleteById = function (id) {
  return this.findOneAndUpdate({ _id: id }).exec();
};

VehicleSchema.statics.markExpired = function (id) {
  return this.findOneAndUpdate({ _id: id }, { expired: true }).exec();
};

VehicleSchema.statics.findById = function (id) {
  return this.findOne({ _id: id }).populate("transporter").exec();
};

VehicleSchema.statics.findAll = function (id) {
  return this.find({}).populate("transporter").exec();
};

VehicleSchema.statics.getVehiclesByTime = function (type) {
  if (type === 'monthlyCount') {
    let date = new Date();
    let last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.find({ createdAt: { $gte: last } }).populate("transporter").exec();
  } else if (type === 'weeklyCount') {
    let date = new Date();
    let last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.find({ createdAt: { $gte: last } }).populate("transporter").exec();
  } else if (type === 'currentCount') {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    return this.find({ createdAt: { $gte: new Date(yyyy + '-' + mm + '-' + dd) } }).populate("transporter").exec();
  } else {
    return this.find({}).populate("transporter").exec();
  }
}

VehicleSchema.statics.getCount = function () {
  return this.count({}).exec();
}

VehicleSchema.statics.getNewCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({ approved: false, updatedAt: { $gte: last } }).exec();
};

VehicleSchema.statics.getWeeklyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({ createdAt: { $gte: last } }).exec();
};

VehicleSchema.statics.getMonthlyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
  return this.count({ createdAt: { $gte: last } }).exec();
};

VehicleSchema.statics.getCountCurrentDate = function () {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, '0');
  let mm = String(today.getMonth() + 1).padStart(2, '0');
  let yyyy = today.getFullYear();
  return this.count({ createdAt: { $gte: new Date(yyyy + '-' + mm + '-' + dd) } }).exec();
};

VehicleSchema.statics.getByTransporter = function (id) {
  return this.find({
    $or: [{ transporter: id }, { drivers: { $in: [id] } }],
    expired: { $ne: true },
    // deleted: { $ne: true },
  })
    .populate("drivers")
    .exec();
};

// VehicleSchema.statics.activate = function(id, location) {
//   console.log(location);
//   return this.findOneAndUpdate(
//     { _id: id },
//     { approved: true },
//     { new: true }
//   ).exec();
// };

VehicleSchema.statics.activate = function (id, data) {
  return this.findOneAndUpdate(
    { _id: id },
    { $set: data },
    { new: true }
  ).exec();
};

// StoreSchema.statics.updateUser = function (id, data) {
//   return this.findOneAndUpdate(
//     { _id: id },
//     { $set: data },
//     { new: true }
//   ).exec();
// };

VehicleSchema.statics.updateById = function (id, data) {
  return this.findOneAndUpdate({ _id: id }, { $set: data }, { new: true })
    .populate("transporter")
    .exec();
};

VehicleSchema.statics.addDriver = function (id, driver) {
  return this.findOneAndUpdate(
    { _id: id },
    { $addToSet: { drivers: driver } },
    { new: true }
  ).exec();
};

VehicleSchema.statics.removeDriver = function (id, driver) {
  return this.findOneAndUpdate(
    { _id: id },
    { $pull: { drivers: driver } },
    { new: true }
  ).exec();
};

VehicleSchema.statics.toggleActive = function (id, active) {
  return this.findOneAndUpdate({ _id: id }, { active: active }, { new: true })
    .populate("transporter")
    .exec();
};

VehicleSchema.statics.findMyVehicle = function (user, data) {
  let query = { transporter: user };

  if (data.text) {
    query["$or"] = [
      { mode: { $regex: data.text, $options: "i" } },
      { make: { $regex: data.text, $options: "i" } },
      { model: { $regex: data.text, $options: "i" } },
      { bodyType: { $regex: data.text, $options: "i" } },
      { airline: { $regex: data.text, $options: "i" } },
      { information: { $regex: data.text, $options: "i" } },
      { flightNumber: { $regex: data.text, $options: "i" } },
      { numberPlate: { $regex: data.text, $options: "i" } },
    ];
  }

  // console.log(query);
  return this.find(query).exec();
};

VehicleSchema.statics.findMyMode = function (user, data) {
  let query = { transporter: user, mode: { $regex: data.text, $options: "i" } };

  console.log(query);
  return this.find(query).exec();
};

VehicleSchema.statics.search = function (text) {
  return this.find({
    $or: [
      { mode: { $regex: text, $options: "i" } },
      { numberPlate: { $regex: text, $options: "i" } },
      { color: { $regex: text, $options: "i" } },
      { make: { $regex: text, $options: "i" } },
      { model: { $regex: text, $options: "i" } },
    ],
  }).exec();
};
module.exports = mongoose.model("Vehicle", VehicleSchema);
