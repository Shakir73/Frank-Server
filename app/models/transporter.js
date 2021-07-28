"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TransporterSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true, index: true }, // Unique assigned by Abdul Bari
    password: { type: String, select: false },
    mobile: { type: String, unique: true, index: true }, // Unique assigned by Abdul Bari
    picture: String,
    dob: Date,
    gender: String,
    identity: [Object],
    license: [Object],
    visa: [Object],
    mode: [String],
    travelling: [{ type: Schema.Types.ObjectId, ref: "Journey" }],
    config: {
      currency: { type: String, default: "EUR" },
      language: { type: String, default: "en" },
      weightUnit: { type: String, default: "kg" },
      measurementUnit: { type: String, default: "m" },
    },
    location: Object,
    smsCode: String,
    emailCode: String,
    recoveryCode: String,
    deviceToken: String,
    platform: String,
    idenfyScanRef: String,
    licenseRef: String,
    visaRef: String,
    transporterType: { type: String, default: "single" }, //single / fleetOwner
    numberOfVehicles: { type: Number, default: 0 },
    numberOfDrivers: { type: Number, default: 0 },
    idCardExpiry: { type: Number, default: 0 },
    licenseExpiry: { type: Number, default: 0 },
    visaExpiry: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    available: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    isSubDriver: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    twoFactorLogin: { type: Boolean, default: false },
    agreeToTerms: { type: Boolean, default: false },
    admin: { type: Schema.Types.ObjectId, ref: "Transporter" },
    ranking: { type: Schema.Types.ObjectId, ref: "Rank" },
    vehicles: {
      type: [{ type: Schema.Types.ObjectId, ref: "Vehicle" }],
      select: false,
    },
    bankInfo: {
      type: Schema.ObjectId,
      ref: "BankAccount",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  { timestamps: true }
);

TransporterSchema.virtual("percentage", {
  ref: "Earning",
  foreignField: "transporters",
  localField: "_id",
  justOne: true,
});

// TransporterSchema.index({ "serviceAreas.location": "2dsphere" });
// TransporterSchema.index({ "travellingInfo.origin.location": "2dsphere" });
// TransporterSchema.index({ "travellingInfo.destination.location": "2dsphere" });
TransporterSchema.statics.login = function (data) {
  return this.findOne({ email: data.email, password: data.password }).exec();
};

TransporterSchema.pre(/^find/, function (next) {
  this.find({ deleted: { $ne: true } });
  next();
});

TransporterSchema.statics.verify = function (id, data) {
  return this.findOne({
    _id: id,
    emailCode: data.emailCode,
    smsCode: data.smsCode,
  }).exec();
};

TransporterSchema.statics.verifyLogin = function (data) {
  return this.findOne({
    mobile: data.mobile,
    smsCode: data.smsCode,
  }).exec();
};

TransporterSchema.statics.findByEmailOrMobile = function (email, mobile) {
  return this.findOne({
    $or: [{ email: email }, { mobile: mobile }],
    // deleted: { $ne: true },
  }).exec();
};

TransporterSchema.statics.findByEmail = function (email) {
  return this.findOne({
    email: email,
    // deleted: { $ne: true },
  }).exec();
};

TransporterSchema.statics.findByMobile = function (mobile) {
  return this.findOne({
    mobile: mobile,
    // deleted: { $ne: true },
  }).exec();
};

TransporterSchema.statics.findById = function (id) {
  return this.findOne({ _id: id })
    .select("+vehicles")
    .select("+bankInfo")
    .populate("vehicles")
    .populate("bankInfo")
    .populate("ranking")
    .populate({ path: "percentage", select: "percentage" })
    .populate({
      path: "travelling",
      populate: "originStation destinationStation",
    })
    .exec();
};

TransporterSchema.statics.findByIdSelectPassword = function (id) {
  return this.findOne({
    _id: id,
  })
    .select("+password")
    .exec();
};

TransporterSchema.statics.findByIds = function (ids) {
  return this.find({ _id: { $in: ids } })
    .populate("travelling")
    .exec();
};

TransporterSchema.statics.findByJourneys = function (ids) {
  return this.find({ travelling: { $in: ids } })
    .populate("travelling")
    .exec();
};

TransporterSchema.statics.findMyDrivers = function (id) {
  return this.find({ admin: id })
    .select("+vehicles")
    .populate("vehicles")
    .populate({ path: "percentage", select: "percentage" })
    .exec();
};

TransporterSchema.statics.searchMyDrivers = function (user, data) {
  let query = { admin: user };

  if (data.text) {
    query["$or"] = [
      { firstName: { $regex: data.text, $options: "i" } },
      { lastName: { $regex: data.text, $options: "i" } },
      { email: { $regex: data.text, $options: "i" } },
      { mobile: { $regex: data.text, $options: "i" } },
    ];
  }

  // console.log(query);
  return this.find(query).exec();
};

TransporterSchema.statics.deleteDriver = function (id, driver) {
  return this.findOneAndUpdate(
    { _id: driver, admin: id },
    {
      // deleted: true,
    },
    { new: true }
  ).exec();
};

TransporterSchema.statics.deleteVehicleById = function (userId, vehicleId) {
  return this.findOneAndUpdate(
    { _id: userId },
    { $pull: { vehicles: vehicleId } }
  ).exec();
};

TransporterSchema.statics.findAll = function (type) {
  if (type === "monthlyCount") {
    let date = new Date();
    let last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.find({ active: false, createdAt: { $gte: last } }).exec();
  } else if (type === "weeklyCount") {
    let date = new Date();
    let last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.find({ active: false, createdAt: { $gte: last } }).exec();
  } else if (type === "currentCount") {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = String(today.getMonth() + 1).padStart(2, "0");
    let yyyy = today.getFullYear();
    return this.find({
      createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
    }).exec();
  } else {
    return this.find({})
      .populate({ path: "percentage", select: "percentage" })
      .exec();
  }
};

TransporterSchema.statics.findNearby = function (location) {
  return this.aggregate([
    {
      $geoNear: {
        near: location,
        spherical: true,
        distanceField: "distance",
        includeLocs: "location",
        maxDistance: 50 / 3963.2,
      },
    },
  ]).populate("travelling");
};

TransporterSchema.statics.findWithinPolygon = function (data) {
  let polygon = [
    [67.10753917694092, 24.82339212962013],
    [67.10899829864502, 24.81737417283458],
    [67.11822509765625, 24.819263336380317],
    [67.11680889129639, 24.825144877591388],
    [67.10753917694092, 24.82339212962013],
  ];
  let params = {
    location: {
      $geoWithin: {
        $geometry: polygon,
      },
    },
  };

  // for (let index = 0; index < areas.length; index++) {
  //   const element = areas[index];

  // }
  console.log(params);
  return this.find(params).exec();
};

TransporterSchema.statics.findNearbyTravellers = function (location, ids) {
  const distance = 50;
  const params = {
    $or: [
      {
        "travellingInfo.origin.location": {
          $geoWithin: {
            $centerSphere: [location, distance / 3963.2],
          },
        },
      },
      {
        "travellingInfo.destination.location": {
          $geoWithin: {
            $centerSphere: [location, distance / 3963.2],
          },
        },
      },
    ],
    _id: { $nin: ids },
  };
  return this.find(params).exec();
};

TransporterSchema.statics.updateTransporter = function (id, data) {
  return this.findOneAndUpdate(
    { _id: id },
    { $set: data },
    { new: true }
  ).exec();
};

TransporterSchema.statics.addVehicle = function (id, vehicle) {
  return this.findOneAndUpdate(
    { _id: id },
    { $addToSet: { vehicles: vehicle } },
    { new: true }
  ).exec();
};

TransporterSchema.statics.addServiceArea = function (id, location) {
  console.log(location);
  return this.findOneAndUpdate(
    { _id: id },
    { $addToSet: { serviceAreas: location } },
    { new: true }
  ).exec();
};

TransporterSchema.statics.addJourney = function (id, travellingId) {
  return this.findOneAndUpdate(
    { _id: id },
    { $addToSet: { travelling: travellingId } },
    { new: true }
  ).exec();
};

TransporterSchema.statics.activate = function (id, location) {
  console.log(location);
  return this.findOneAndUpdate(
    { _id: id },
    { active: true },
    { new: true }
  ).exec();
};

TransporterSchema.statics.blockDriver = function (id, flag) {
  return this.findOneAndUpdate(
    { _id: id },
    { blocked: flag },
    { new: true }
  ).exec();
};

TransporterSchema.statics.getCount = function () {
  return this.count({}).exec();
};

TransporterSchema.statics.getCountCurrentDate = function () {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = today.getFullYear();
  return this.count({
    createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
  }).exec();
};

TransporterSchema.statics.getNewCount = function () {
  let date = new Date();
  let last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({ active: false, createdAt: { $gte: last } }).exec();
};

TransporterSchema.statics.getWeeklyCount = function () {
  let date = new Date();
  let last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({ active: false, createdAt: { $gte: last } }).exec();
};

TransporterSchema.statics.getMonthlyCount = function () {
  let date = new Date();
  let last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
  return this.count({ active: false, createdAt: { $gte: last } }).exec();
};

TransporterSchema.statics.getNewCountBetweenDates = function (start, end) {
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

TransporterSchema.statics.search = function (text) {
  return this.find({
    $or: [
      { firstName: { $regex: text, $options: "i" } },
      { lastName: { $regex: text, $options: "i" } },
      { email: { $regex: text, $options: "i" } },
      { mobile: { $regex: text, $options: "i" } },
    ],
  }).exec();
};

TransporterSchema.statics.filter = function (data) {
  let { minAge, maxAge, minRequests, maxRequests } = data;
  // console.log(data);
  var query = {};
  if (minAge != undefined && maxAge != undefined) {
    var sDate = new Date();
    sDate.setFullYear(sDate.getFullYear() - maxAge);
    var eDate = new Date();
    eDate.setFullYear(eDate.getFullYear() - minAge);
    query.dob = { $gte: sDate, $lte: eDate };
  }
  if (minRequests != undefined && maxRequests != undefined) {
    query.totalOrders = { $gte: minRequests, $lte: maxRequests };
  }
  // console.log(query);
  return this.find(query).exec();
};

TransporterSchema.statics.topTransporters = function () {
  return this.find({}).sort({ totalOrders: -1 }).limit(4).exec();
};

TransporterSchema.statics.forceUpdate = function (id) {
  return this.update({}, { $set: { ranking: id } }, { multi: true }).exec();
};

TransporterSchema.statics.deleteById = function (id) {
  return this.deleteOne({ _id: id }).exec();
};

TransporterSchema.statics.deleteJourneyById = function (id, journey) {
  return this.findOneAndUpdate(
    { _id: id },
    { $pull: { travelling: journey } }
  ).exec();
};

module.exports = mongoose.model("Transporter", TransporterSchema);
