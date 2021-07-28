"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var StoreSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    contactDetail: {
      name: String,
      mobile: String,
      language: String,
    },
    // emailAddresses: [{ email: String, verified: Boolean, role: String }],
    emailAddresses: [{ type: mongoose.Schema.ObjectId, ref: "StoreUser", }],
    city: String,
    zipCode: String,
    country: String,
    totalStores: { type: Number, default: 1 },
    name: String,
    picture: String,
    email: { type: String },
    password: { type: String, select: false },
    mobile: String,
    countryCode: String,
    uniqueID: { type: String, index: true, unique: true },
    storeURL: String,
    endPoint: String,
    address1: String,
    address2: String,
    address3: String,
    facebookLink: String,
    instagramLink: String,
    acceptsReturn: { type: Boolean, default: true },
    location1: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ["Point"], // 'location.type' must be 'Point'
      },
      coordinates: {
        type: [Number],
      },
    },
    location2: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ["Point"], // 'location.type' must be 'Point'
      },
      coordinates: {
        type: [Number],
      },
    },
    location3: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ["Point"], // 'location.type' must be 'Point'
      },
      coordinates: {
        type: [Number],
      },
    },
    smsCode: String,
    emailCode: String,
    recoveryCode: String,
    platform: String,
    config: {
      currency: { type: String, default: "EUR" },
      language: { type: String, default: "en" },
      weightUnit: { type: String, default: "kg" },
      measurementUnit: { type: String, default: "m" },
    },
    accessibleTill: Date,
    totalOrders: { type: Number, default: 0 },
    Orders: { type: Object },
    isVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    policies: [
      {
        policyId: String,
        startDate: Date,
        endDate: Date,
        createdAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    activeLog: [
      {
        userId: { type: mongoose.Schema.ObjectId, ref: "Admin" },
        reason: String,
        active: Boolean,
        createdAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],

    banned: { type: Boolean, default: false },
    banLog: {
      reason: String,
      userId: { type: mongoose.Schema.ObjectId, ref: "Admin" },
      dateTime: { type: Date, default: Date.now() },
    },
    deleted: { type: Boolean, default: false },
    agreeToTerms: { type: Boolean, default: false },
    customers: { type: Array },
  },
  { timestamps: true }
);

StoreSchema.pre(/^find/, function (next) {
  this.find({ deleted: { $ne: true } });
  next();
});

StoreSchema.pre(/^find/, function (next) {
  this.findOne().populate({ path: "activeLog.userId", select: "name role" });
  next();
});

StoreSchema.statics.login = function (data) {
  return this.findOne({
    mobile: data.mobile,
  }).exec();
};

StoreSchema.statics.findByEmailOrMobile = function (data) {
  return this.findOne({
    $or: [{ email: data.email }, { mobile: data.mobile }],
  }).exec();
};

StoreSchema.statics.findByUniqueID = function (uniqueID) {
  return this.findOne({
    uniqueID,
  }).exec();
};

StoreSchema.statics.findByEmail = function (email) {
  return this.findOne({
    email: email,
  }).exec();
};

StoreSchema.statics.findByEmailAndPassword = function (data) {
  return this.findOne({
    email: data.email,
    password: data.password,
  }).exec();
};

StoreSchema.statics.findByMobile = function (mobile) {
  return this.findOne({
    mobile: mobile,
  }).exec();
};

StoreSchema.statics.verifyLogin = function (data) {
  return this.findOne({
    mobile: data.mobile,
    smsCode: data.smsCode,
  }).exec();
};

StoreSchema.statics.findById = function (id) {
  return this.findOne({
    _id: id,
  }).exec();
};

StoreSchema.statics.findByIds = function (ids) {
  return this.find({
    _id: { $in: ids },
  }).exec();
};

StoreSchema.statics.findByIdSelectPassword = function (id) {
  return this.findOne({
    _id: id,
  })
    .select("+password")
    .exec();
};

StoreSchema.statics.verify = function (id, data) {
  return this.findOne({
    _id: id,
    emailCode: data.emailCode,
    smsCode: data.smsCode,
  }).exec();
};

StoreSchema.statics.findAll = function () {
  return this.find({}).select(
    "-policies -activeLog -location2 -location3 -config -banLog"
  );
};

StoreSchema.statics.search = function (text) {
  return this.find({
    $or: [
      // { firstName: { $regex: text, $options: "i" } },
      // { lastName: { $regex: text, $options: "i" } },
      { mobile: { $regex: text, $options: "i" } },
      { city: { $regex: text, $options: "i" } },
      { name: { $regex: text, $options: "i" } },
    ],
  }).exec();
};

StoreSchema.statics.topUsers = function () {
  return this.find({}).sort({ totalOrders: -1 }).limit(4).exec();
};

StoreSchema.statics.getCount = function () {
  return this.count({}).exec();
};

StoreSchema.statics.updateUser = function (id, data) {
  return this.findOneAndUpdate(
    { _id: id },
    { $set: data },
    { new: true }
  ).exec();
};

StoreSchema.statics.addEmailAddress = function (id, data) {
  return this.findOneAndUpdate(
    { _id: id },
    { $addToSet: { emailAddresses: data } },
    { new: true }
  );
};

StoreSchema.statics.deleteById = function (id) {
  return this.findOneAndUpdate(
    { _id: id },
    { $set: { deleted: true, active: false } },
    { new: true }
  ).exec();
};

StoreSchema.statics.getNewCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({ createdAt: { $gte: last } }).exec();
};

StoreSchema.statics.getNewCountBetweenDates = function (start, end) {
  return this.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);
};

module.exports = mongoose.model("Store", StoreSchema);
