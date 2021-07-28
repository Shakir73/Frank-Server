"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TimeSlotSchema = new Schema(
  {
    timeSlot: [{
      from: String,
      to: String,
      daily: { type: Boolean, default: false },
      startDate: Date,
      endDate: Date,
      createdAt: { type: Date, default: Date.now() }
    }],
    dates: [Date],
    startDate: Date,
    endDate: Date,
    daily: { type: Boolean, default: false },
    transporter: { type: Schema.Types.ObjectId, ref: "Transporter" },
  },
  { timestamps: true }
);

TimeSlotSchema.statics.deleteById = function (id) {
  return this.findOneAndDelete({ _id: id }).exec();
};

TimeSlotSchema.statics.findAll = function (profileId) {
  return this.find();
  let date = new Date();
  let mm = (date.getMonth() + 1).toString();
  mm = mm.length <=1 ? mm = `0${mm}` : mm = `${mm}`;
  // console.log(mm);
  let fullCurrnetDate = `${date.getFullYear()}-${mm}-${date.getDate()}`;
  fullCurrnetDate = new Date(fullCurrnetDate);
  // console.log(fullCurrnetDate);
  // return this.find({ $or:
  //   [
  //     { startDate: { $gte: fullCurrnetDate } },
  //     { dates: { $in: fullCurrnetDate } }
  //   ]
  // });
  // console.log(fullCurrnetDate.parseDate);
  
  // console.log(new Date(fullCurrnetDate));
  return this.aggregate([
    {
      $unwind: '$dates',
    },
    {
      $unwind: '$timeSlot',
    },
    {
      $unwind: '$service',
    },
    {
      $match: {
        // endDate: { $gte: fullCurrnetDate },
        // dates: { $gte: fullCurrnetDate }
        $and: [
          { dates: { $gte: fullCurrnetDate } },
        //   { startDate: { $lte: fullCurrnetDate } },
        //   // { endDate: { $lte: fullCurrnetDate } },
        ],
      },
    }
  ]).exec();
};

TimeSlotSchema.statics.findByTransporter = function (profileId) {
  return this.find({ transporter: profileId }).exec();
};

TimeSlotSchema.statics.findByDates = function (data) {
  let s = data.startDate;
  let e = data.endDate;
  return this.aggregate([
    {
      $match: {
        dates: { $gt: new Date(data.startDate) },
      },
    },
  ]).exec();
};

//find by point
TimeSlotSchema.statics.findByLocation = function (location, type) {
  let query = {
    location: {
      $geoWithin: {
        $centerSphere: [location, 25 / 3963.2],
      },
    },
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

TimeSlotSchema.statics.findByCity = function (city) {
  let query = {};
  if (city) {
    query["$or"] = [
      { city: { $regex: city, $options: "i" } },
      { state: { $regex: city, $options: "i" } },
      { country: { $regex: city, $options: "i" } },
      { name: { $regex: city, $options: "i" } },
      { icao: { $regex: city, $options: "i" } },
    ];
  }
  return this.find(query).exec();
};

module.exports = mongoose.model("TimeSlot", TimeSlotSchema);
