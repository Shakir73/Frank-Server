"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    name: String,
    picture: String,
    dob: Date,
    gender: String,
    email: { type: String, unique: true, index: true },
    password: { type: String, select: false },
    mobile: { type: String, unique: true },
    smsCode: String,
    emailCode: String,
    recoveryCode: String,
    deviceToken: String,
    platform: String,
    config: {
      currency: { type: String, default: "EUR" },
      language: { type: String, default: "en" },
      weightUnit: { type: String, default: "kg" },
      measurementUnit: { type: String, default: "m" },
    },
    tempToken: { type: String, select: false },
    tempTokenExpiry: { type: Date, select: false },
    rating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    twoFactorLogin: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    banned: { type: Boolean, default: false },
    agreeToTerms: { type: Boolean, default: false },
    store: String,
  },
  { timestamps: true }
);

UserSchema.statics.login = function (data) {
  return this.findOne({ mobile: data.mobile, password: data.password }).exec();
};

UserSchema.statics.findByEmailOrMobile = function (data) {
  return this.findOne({
    $or: [{ email: data.email }, { mobile: data.mobile }],
  }).exec();
};

UserSchema.statics.findByEmail = function (email) {
  return this.findOne({
    email: email,
  }).exec();
};

UserSchema.statics.findByMobile = function (mobile) {
  return this.findOne({
    mobile: mobile,
  }).exec();
};

UserSchema.statics.findByToken = function (token) {
  return this.findOne({
    tempToken: token,
  }).exec();
};

UserSchema.statics.verifyLogin = function (data) {
  return this.findOne({
    mobile: data.mobile,
    smsCode: data.smsCode,
  }).exec();
};

UserSchema.statics.findById = function (id) {
  return this.findOne({
    _id: id,
  }).exec();
};

UserSchema.statics.findByIds = function (ids) {
  return this.find({
    _id: { $in: ids },
  }).exec();
};

UserSchema.statics.findByIdSelectPassword = function (id) {
  return this.findOne({
    _id: id,
  })
    .select("+password")
    .exec();
};

UserSchema.statics.verify = function (id, data) {
  return this.findOne({
    _id: id,
    emailCode: data.emailCode,
    smsCode: data.smsCode,
  }).exec();
};

UserSchema.statics.findAll = function () {
  return this.find({}).sort('-totalOrders').select('-config');
};

UserSchema.statics.search = function (text) {
  return this.find({
    $or: [
      { firstName: { $regex: text, $options: "i" } },
      { lastName: { $regex: text, $options: "i" } },
      { mobile: { $regex: text, $options: "i" } },
      { email: { $regex: text, $options: "i" } },
    ],
  }).exec();
};

UserSchema.statics.topUsers = function () {
  return this.find({}).sort({ totalOrders: -1 }).limit(4).exec();
};

UserSchema.statics.getCount = function () {
  return this.count({}).exec();
};

UserSchema.statics.getCountCurrentDate = function () {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, '0');
  let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  let yyyy = today.getFullYear();
  return this.count({ createdAt: { $gte: new Date(yyyy + '-' + mm + '-' + dd) } }).exec();
};

UserSchema.statics.getUserByType = function(type) {
  if (type === 'currentCount') {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    return this.find({ createdAt: { $gte: new Date(yyyy + '-' + mm + '-' + dd) } }).exec();
  } else if (type === 'weeklyCount') {
    let date = new Date();
    let last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.find({ createdAt: { $gte: last } }).exec();
  } else if (type === 'monthlyCount') {
    let date = new Date();
    let last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.find({ createdAt: { $gte: last } }).exec();
  } else {
    return this.find().exec();
  }
}

UserSchema.statics.updateUser = function (id, data) {
  return this.findOneAndUpdate(
    { _id: id },
    { $set: data },
    { new: true }
  ).exec();
};

UserSchema.statics.deleteById = function (id) {
  return this.deleteOne({ _id: id }).exec();
};

UserSchema.statics.getNewCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({ createdAt: { $gte: last } }).exec();
};

UserSchema.statics.getWeeklyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({ createdAt: { $gte: last } }).exec();
};

UserSchema.statics.getMonthlyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
  return this.count({ createdAt: { $gte: last } }).exec();
};

UserSchema.statics.getNewCountBetweenDates = function (start, end) {
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

module.exports = mongoose.model("User", UserSchema);
