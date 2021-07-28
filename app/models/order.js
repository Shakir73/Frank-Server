"use strict";
const mongoose = require("mongoose");
const Store = require("./store");
const Transporter = require("./transporter");
const User = require("./user");

const Schema = mongoose.Schema;

var OrderSchema = new Schema(
  {
    type: String,
    territory: String,
    pickup: {
      location: Object,
      address: String,
      shortAddress: String,
      city: String,
      country: String,
      space: { type: Schema.Types.ObjectId, ref: "Space" },
      pickupPoint: { type: Schema.Types.ObjectId, ref: "Space" },
    },
    returnAddress: {
      location: Object,
      address: String,
      shortAddress: String,
      city: String,
      country: String,
      space: { type: Schema.Types.ObjectId, ref: "Space" },
    },
    dropoff: {
      location: Object,
      address: String,
      shortAddress: String,
      city: String,
      country: String,
      space: { type: Schema.Types.ObjectId, ref: "Space" },
    },
    orderNumber: { type: Number, default: 0 },
    storeOrderID: String,
    commodities: [{ type: Schema.Types.ObjectId, ref: "Commodity" }],
    returns: [
      {
        commodity: String,
        reason: String,
        description: String,
      },
    ],
    pickupDate: Date,
    pickupTime: {
      from: String,
      to: String,
    },
    deliveryDate: Date,
    deliveryTime: {
      from: String,
      to: String,
    },
    promotion: { type: mongoose.Schema.ObjectId, ref: "Promotion" },
    deliveredDate: Date,
    sendText: { type: Boolean, default: false },
    acceptedNewPrice: { type: Boolean, default: true },
    needHelper: { type: Boolean, default: false },
    flexibleDate: { type: Boolean, default: false },
    flexibleDeliveryDate: { type: Boolean, default: false },
    isReturnOrder: { type: Boolean, default: false },
    timeLogs: {
      accepted: Date,
      picked: Date,
      delivered: Date,
      cancelled: Date,
    },
    contact: {
      name: String,
      firstName: String,
      lastName: String,
      number: String,
      countryCode: String,
      email: String,
    },
    aboutAddress: {
      building: String,
      door: String,
      digitalCode: String,
      floor: String,
      additionalInfo: String,
    },
    deliverTo: String,
    emergencyNumber: String,
    secondaryContact: {
      name: String,
      number: String,
      countryCode: String,
      email: String,
    },
    pickupImages: [String],
    deliveredImages: [String],
    statusLog: [String],
    subOrder: { type: Boolean, default: false },
    allowMultipleRoutes: { type: Boolean, default: false },
    readyForPickup: { type: Boolean, default: false },
    routes: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    currentLocation: Object,
    deliveryType: String, // urgent/standard/economical
    picture: String,
    notes: String,
    preferredMode: String,
    staticMap: String,
    cancellationReason: String,
    bonus: Number,
    disputes: [{ reason: String, filedBy: String, status: String }],
    status: { type: String, default: "pending" }, //pending/accepted/onmyway/picked/delivered/cancelled
    editToken: { type: String, select: false },
    editTokenExpiry: { type: Date, select: false },
    config: {
      currency: { type: String, default: "EUR" },
      weightUnit: { type: String, default: "kg" },
      measurementUnit: { type: String, default: "m" },
    },
    originalOrder: { type: Schema.Types.ObjectId, ref: "Order" },
    transporter: {
      type: Schema.Types.ObjectId,
      ref: "Transporter",
      index: true,
    },
    previousTransporter: {
      type: Schema.Types.ObjectId,
      ref: "Transporter",
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle" },
    rating: { type: Schema.Types.ObjectId, ref: "Feedback" },
    customerRating: { type: Schema.Types.ObjectId, ref: "Feedback" },
    rates: { type: Schema.Types.ObjectId, ref: "Rates" },
    price: Number,
    promo: { type: Schema.Types.ObjectId, ref: "Promo" },
    store: { type: Schema.Types.ObjectId, ref: "Store" },
    transporterPromo: { type: Schema.Types.ObjectId, ref: "Promo" },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ "pickup.location": "2dsphere" });
OrderSchema.index({ "dropoff.location": "2dsphere" });

OrderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "transporter",
    populate: { path: "percentage", select: "percentage" },
  });
  next();
});
OrderSchema.statics.findAll = function () {
  return this.find({ subOrder: { $ne: true } })
    .populate("user")
    .populate("transporter")
    .populate("rating")
    .populate("rates")
    .sort({ createdAt: -1 })
    .exec();
};

OrderSchema.statics.recentOrders = function () {
  return this.find({}).sort({ pickupDate: -1 }).limit(4).exec();
};

OrderSchema.statics.findWithinPolygon = function (serviceAreas, page) {
  let params = { status: "pending" };
  let query = [];
  const distance = 5;
  for (let index = 0; index < serviceAreas.length; index++) {
    const element = serviceAreas[index];

    if (element) {
      if (element.type === "polygon") {
        query.push({
          "pickup.location": {
            $geoWithin: {
              $geometry: element.polygon,
            },
          },
        });
        query.push({
          "dropoff.location": {
            $geoWithin: {
              $geometry: element.polygon,
            },
          },
        });
      } else {
        query.push({
          "pickup.location": {
            $geoWithin: {
              $centerSphere: [element.location, distance / 3963.2],
            },
          },
        });
        query.push({
          "dropoff.location": {
            $geoWithin: {
              $centerSphere: [element.location, distance / 3963.2],
            },
          },
        });
      }
    }
  }
  if (query.length > 0) {
    params["$or"] = query;
  }
  let skip = 0;
  let limit = 0;
  if (page) {
    skip = 50 * (page - 1);
    limit = 50;
  }
  // console.log(params);
  return this.find(params)
    .populate("user")
    .populate("transporter")
    .populate("promo")
    .populate("store")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .limit(limit)
    .skip(skip)
    .sort({ pickupDate: -1 })
    .exec();
};

OrderSchema.statics.countWithinPolygon = function (serviceAreas) {
  let params = { status: "pending" };
  let query = [];
  const distance = 5;
  for (let index = 0; index < serviceAreas.length; index++) {
    const element = serviceAreas[index];

    if (element) {
      if (element.type === "polygon") {
        query.push({
          "pickup.location": {
            $geoWithin: {
              $geometry: element.polygon,
            },
          },
        });
        query.push({
          "dropoff.location": {
            $geoWithin: {
              $geometry: element.polygon,
            },
          },
        });
      } else {
        query.push({
          "pickup.location": {
            $geoWithin: {
              $centerSphere: [element.location, distance / 3963.2],
            },
          },
        });
        query.push({
          "dropoff.location": {
            $geoWithin: {
              $centerSphere: [element.location, distance / 3963.2],
            },
          },
        });
      }
    }
  }
  if (query.length > 0) {
    params["$or"] = query;
  }

  return this.count(params).exec();
};

OrderSchema.statics.findByJourneys = function (locations, page) {
  let params = { status: "pending" };
  let query = [];
  const distance = 5;
  for (let index = 0; index < locations.length; index++) {
    const element = locations[index];
    // console.log("elem: ", element);
    if (element) {
      query.push({
        "pickup.location": {
          $geoWithin: {
            $centerSphere: [element.origin.location, distance / 3963.2],
          },
        },
      });
      query.push({
        "dropoff.location": {
          $geoWithin: {
            $centerSphere: [element.destination.location, distance / 3963.2],
          },
        },
      });
    }
  }
  if (query.length > 0) {
    params["$or"] = query;
  }
  let skip = 0;
  let limit = 0;
  if (page) {
    skip = 50 * (page - 1);
    limit = 50;
  }
  // console.log("journey param: ", params);
  return this.find(params)
    .populate("user")
    .populate("transporter")
    .populate("promo")
    .populate("store")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .limit(limit)
    .skip(skip)
    .sort({ pickupDate: -1 })
    .exec();
};

OrderSchema.statics.findByLocation = function (location, page) {
  let params = { status: "pending" };
  let query = [];
  const distance = 5;

  query.push({
    "pickup.location": {
      $geoWithin: {
        $centerSphere: [location, distance / 3963.2],
      },
    },
  });

  if (query.length > 0) {
    params["$or"] = query;
  }
  let skip = 0;
  let limit = 0;
  if (page) {
    skip = 50 * (page - 1);
    limit = 50;
  }
  // console.log("journey param: ", params);
  return this.find(params)
    .populate("user")
    .populate("transporter")
    .populate("promo")
    .populate("store")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .limit(limit)
    .skip(skip)
    .sort({ pickupDate: -1 })
    .exec();
};

OrderSchema.statics.findNew = function (areas) {
  let params = { status: "pending", subOrder: false };
  const distance = 5;
  let query = [];

  for (let index = 0; index < areas.length; index++) {
    const element = areas[index];
    if (element) {
      query.push({
        "pickup.location": {
          $geoWithin: {
            $centerSphere: [element, distance / 3963.2],
          },
        },
      });
      query.push({
        "dropoff.location": {
          $geoWithin: {
            $centerSphere: [element, distance / 3963.2],
          },
        },
      });
    }
  }
  if (query.length > 0) {
    params["$or"] = query;
  }

  return this.find(params)
    .populate("user")
    .populate("transporter")
    .populate("promo")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .sort({ pickupDate: -1 })
    .exec();
};

OrderSchema.statics.findByEditingToken = function (token) {
  let date = new Date();
  date.setMinutes(date.getMinutes() + 10);
  return this.findOne({ editToken: token, editTokenExpiry: { $lte: date } })
    .select("+editToken")
    .select("+editTokenExpiry")
    .populate("user")
    .populate("transporter")
    .populate("previousTransporter")
    .populate("promo")
    .populate("rating")
    .populate("customerRating")
    .populate("rates")
    .populate("vehicle")
    .populate("routes")
    .populate("pickup.space")
    .populate("dropoff.space")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .populate({ path: "routes", populate: { path: "transporter" } })
    .exec();
};
OrderSchema.statics.findById = function (id) {
  return this.findOne({ _id: id })
    .select("+editToken")
    .select("+editTokenExpiry")
    .populate("user")
    .populate("transporter")
    .populate("previousTransporter")
    .populate("promo")
    .populate("rating")
    .populate("customerRating")
    .populate("rates")
    .populate("vehicle")
    .populate("routes")
    .populate("pickup.space")
    .populate("store")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .populate({ path: "routes", populate: { path: "transporter" } })
    .exec();
};

OrderSchema.statics.searchByOrderNumber = function (orderNumber) {
  if (parseInt(orderNumber)) {
    return this.findOne({ orderNumber })
      .populate("user")
      .populate("transporter")
      .populate("previousTransporter")
      .populate("promo")
      .populate("rating")
      .populate("customerRating")
      .populate("rates")
      .populate({ path: "commodities", populate: { path: "itemType" } })
      .populate({ path: "routes", populate: { path: "transporter" } })
      .exec();
  } else {
    return this.findOne({ storeOrderID: orderNumber })
      .populate("user")
      .populate("transporter")
      .populate("previousTransporter")
      .populate("promo")
      .populate("rating")
      .populate("customerRating")
      .populate("rates")
      .populate({ path: "commodities", populate: { path: "itemType" } })
      .populate({ path: "routes", populate: { path: "transporter" } })
      .exec();
  }
};

OrderSchema.statics.findByPlace = function (user, data) {
  let query = { status: "pending" };

  if (data.pickup) {
    query["pickup.address"] = { $regex: data.pickup, $options: "i" };
  }
  if (data.dropoff) {
    query["dropoff.address"] = { $regex: data.dropoff, $options: "i" };
  }

  console.log(query);
  return this.find(query)
    .populate("user")
    .populate("transporter")
    .populate("previousTransporter")
    .populate("promo")
    .populate("rating")
    .populate("customerRating")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .populate({ path: "routes", populate: { path: "transporter" } })
    .exec();
};

OrderSchema.statics.findByPlaces = function (user, data) {
  let query = {};

  let pickup = [
    { "pickup.address": { $regex: data.pickup, $options: "i" } },
    { "pickup.shortAddress": { $regex: data.pickup, $options: "i" } },
    { "pickup.city": { $regex: data.pickup, $options: "i" } },
    { "pickup.country": { $regex: data.pickup, $options: "i" } },
  ];
  let dropoff = [
    { "dropoff.address": { $regex: data.dropoff, $options: "i" } },
    { "dropoff.shortAddress": { $regex: data.dropoff, $options: "i" } },
    { "dropoff.city": { $regex: data.dropoff, $options: "i" } },
    { "dropoff.country": { $regex: data.dropoff, $options: "i" } },
  ];
  if ((data.pickup && !data.dropoff) || data.dropoff == "") {
    query = { $or: pickup };
  } else if (!data.pickup || (data.pickup == "" && data.dropoff)) {
    query = { $or: dropoff };
  } else if (data.pickup && data.dropoff) {
    const mix = [...pickup, ...dropoff];
    query = { $or: mix };
  }
  return this.find(query).exec();
};

OrderSchema.statics.findMyOrders = function (user, data) {
  let query = {};
  if (data.userType == "user") {
    query.user = user;
  } else {
    query.transporter = user;
  }
  if (data.text) {
    let on = parseInt(data.text);
    query["$or"] = [
      { "pickup.address": { $regex: data.text, $options: "i" } },
      { "dropoff.address": { $regex: data.text, $options: "i" } },
      { status: { $regex: data.text, $options: "i" } },
      { notes: { $regex: data.text, $options: "i" } },
      { "contact.name": { $regex: data.text, $options: "i" } },
      { "contact.number": { $regex: data.text, $options: "i" } },
      { storeOrderID: { $regex: data.text, $options: "i" } },
      // { orderNumber: { $regex: data.text, $options: "i" } },
    ];
    if (on) {
      let functionString = "/^" + on + ".*/.test(this.orderNumber)";
      // query["$or"].push({
      //   $where: functionString,
      // });
      query["$or"].push({ orderNumber: on });
    }
    if (data.vehicles) {
      query["$or"].push({
        vehicle: { $in: data.vehicles },
      });
    }
    if (data.drivers) {
      delete query.transporter;
      query["$or"].push({
        transporter: { $in: data.drivers },
      });
    }
    if (data.commodities) {
      query["$or"].push({
        commodities: { $in: data.commodities },
      });
    }
  }

  console.log(query);
  return this.find(query)
    .populate("user")
    .populate("transporter")
    .populate("previousTransporter")
    .populate("promo")
    .populate("rating")
    .populate("customerRating")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .populate({ path: "routes", populate: { path: "transporter" } })
    .exec();
};

OrderSchema.statics.findDriversOrders = function (user, data) {
  let query = { transporter: { $in: data.drivers } };
  if (data.text) {
    let on = parseInt(data.text);
    query["$or"] = [
      { "pickup.address": { $regex: data.text, $options: "i" } },
      { "dropoff.address": { $regex: data.text, $options: "i" } },
    ];
    if (on != undefined) {
      let functionString = "/^" + on + ".*/.test(this.orderNumber)";
      query["$or"].push({
        $where: functionString,
      });
      // query["$or"].push({ orderNumber: on });
    }
  }

  console.log(query);
  return this.find(query)
    .populate("user")
    .populate("transporter")
    .populate("previousTransporter")
    .populate("promo")
    .populate("rating")
    .populate("customerRating")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .populate({ path: "routes", populate: { path: "transporter" } })
    .exec();
};

OrderSchema.statics.trackById = function (id) {
  return (
    this.findOne({ orderNumber: id })
      // .populate("transporter", "mobile email firstName lastName location")
      .populate("transporter")
      .populate("user", "mobile firstName lastName")
      .populate({ path: "routes", populate: { path: "transporter" } })
      .populate("vehicle")
      .populate("rating")
      .populate("customerRating")
      .populate("rates")
      .populate({ path: "commodities", populate: { path: "itemType" } })
      .exec()
  );
};

OrderSchema.statics.findBySubOrderId = function (id) {
  return this.findOne({ routes: { $in: [id] } })
    .populate("user")
    .populate("transporter")
    .populate({ path: "routes", populate: { path: "transporter" } })
    .populate("rates")
    .exec();
};

OrderSchema.statics.findMyRequests = function (user, status, page) {
  let query = { status, $or: [{ user: user }, { transporter: user }] };
  if (status === "accepted") {
    query["$or"] = [{ user: user }, { transporter: user }];
    query.status = { $in: ["accepted", "picked", "onmyway"] };
  } else if (status === "completed") {
    query["$or"] = [{ user: user }, { transporter: user }];
    query.status = {
      $in: ["delivered"],
    };
  } else if (status === "cancelled") {
    query["$or"] = [{ user: user }, { transporter: user }];
    query.status = {
      $in: [
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
        "cancelledbystore",
      ],
    };
  } else if (status === "delivered") {
    query["$or"] = [{ user: user }, { transporter: user }];
    query.status = {
      $in: [
        "delivered",
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
      ],
    };
  } else if (status === "all") {
    query = {
      $or: [{ user: user }, { transporter: user }],
    };
  }
  console.log(query);
  let skip = 0;
  let limit = 0;
  if (page) {
    skip = 50 * (page - 1);
    limit = 50;
  }
  return this.find(query)
    .populate("user")
    .populate("transporter")
    .populate("rating")
    .populate("rates")
    .populate("store")

    .populate({ path: "commodities", populate: { path: "itemType" } })
    .sort({ pickupDate: -1 })
    .limit(limit)
    .skip(skip)
    .exec();
};

OrderSchema.statics.countMyRequests = function (user, status) {
  let query = { status, $or: [{ user: user }, { transporter: user }] };
  if (status === "accepted") {
    query["$or"] = [{ user: user }, { transporter: user }];
    query.status = { $in: ["accepted", "picked", "onmyway"] };
  } else if (status === "completed") {
    query["$or"] = [{ user: user }, { transporter: user }];
    query.status = {
      $in: ["delivered"],
    };
  } else if (status === "cancelled") {
    query["$or"] = [{ user: user }, { transporter: user }];
    query.status = {
      $in: [
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
        "cancelledbystore",
      ],
    };
  } else if (status === "delivered") {
    query["$or"] = [{ user: user }, { transporter: user }];
    query.status = {
      $in: [
        "delivered",
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
      ],
    };
  } else if (status === "all") {
    query = {
      $or: [{ user: user }, { transporter: user }],
    };
  }
  return this.count(query).exec();
};

OrderSchema.statics.findByDrivers = function (status, drivers) {
  let query = { status, transporter: { $in: drivers } };
  if (status === "accepted") {
    query.status = { $in: ["accepted", "picked", "onmyway"] };
  } else if (status === "completed") {
    query.status = {
      $in: ["delivered"],
    };
  } else if (status === "cancelled") {
    query.status = {
      $in: [
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
        "cancelledbystore",
      ],
    };
  } else if (status === "delivered") {
    query.status = {
      $in: [
        "delivered",
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
      ],
    };
  } else if (status === "all") {
    query = { transporter: { $in: drivers } };
  }
  // console.log(query);
  return this.find(query)
    .populate("user")
    .populate("transporter")
    .populate("rating")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .sort({ pickupDate: -1 })
    .exec();
};

OrderSchema.statics.countByDrivers = function (status, drivers) {
  let query = { status, transporter: { $in: drivers } };
  if (status === "accepted") {
    query.status = { $in: ["accepted", "picked", "onmyway"] };
  } else if (status === "completed") {
    query.status = {
      $in: ["delivered"],
    };
  } else if (status === "cancelled") {
    query.status = {
      $in: [
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
        "cancelledbystore",
      ],
    };
  } else if (status === "delivered") {
    query.status = {
      $in: [
        "delivered",
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
        "cancelledbystore",
      ],
    };
  } else if (status === "all") {
    query = { transporter: { $in: drivers } };
  }
  console.log(query);
  return this.count(query).exec();
};

OrderSchema.statics.findByTransporter = function (transporter, status) {
  let query = { status, transporter };
  if (status === "accepted") {
    query.status = { $in: ["accepted", "picked", "onmyway"] };
  } else if (status === "delivered") {
    query.status = {
      $in: [
        "delivered",
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
        "cancelledbystore",
      ],
    };
  } else if (status === "all") {
    query = { transporter, subOrder: { $ne: true } };
  }
  // console.log(query);
  return this.find(query).sort({ pickupDate: -1 }).exec();
};

OrderSchema.statics.findUserRequests = function (user, status) {
  let query = { status, user, subOrder: { $ne: true } };
  if (status === "accepted") {
    query.status = { $in: ["accepted", "picked", "onmyway"] };
  } else if (status === "delivered") {
    query.status = {
      $in: [
        "delivered",
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
        "cancelledbystore",
      ],
    };
  } else if (status === "all") {
    query = { user, subOrder: { $ne: true } };
  }
  return this.find(query)
    .populate("user")
    .populate("transporter")
    .populate("rating")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .sort({ pickupDate: -1 })
    .exec();
};

OrderSchema.statics.findByStore = function (store, status, type) {
  let query = { status, store, subOrder: { $ne: true } };

  if (status === "new") {
    query.status = { $in: ["pending"] };
  }
  if (status === "inprogress") {
    query.status = { $in: ["accepted", "picked", "onmyway"] };
    console.log(query);
  } else if (status === "delivered") {
    query.status = {
      $in: ["delivered"],
    };
  } else if (status === "cancelled") {
    query.status = {
      $in: [
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
        "cancelledbystore",
      ],
    };
  } else if (status === "all") {
    query = { store, subOrder: { $ne: true } };
  }
  if (type === "return") {
    query.isReturnOrder = true;
  }
  // console.log(query);
  return this.find(query)
    .populate("user")
    .populate("transporter")
    .populate("rating")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .sort({ createdAt: -1 })
    .exec();
};

OrderSchema.statics.countOrders = function (store, status, type) {
  let query = { status, store, subOrder: { $ne: true } };

  if (status === "new") {
    query.status = { $in: ["pending"] };
  }
  if (status === "inprogress") {
    query.status = { $in: ["accepted", "picked", "onmyway"] };
    console.log(query);
  } else if (status === "delivered") {
    query.status = {
      $in: ["delivered"],
    };
  } else if (status === "cancelled") {
    query.status = {
      $in: [
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
        "cancelledbystore",
      ],
    };
  } else if (status === "all") {
    query = { store, subOrder: { $ne: true } };
  }
  if (type === "return") {
    query.isReturnOrder = true;
  }
  // console.log(query);
  return this.count(query).exec();
};

OrderSchema.statics.findByOriginalOrder = function (order) {
  return this.findOne({ originalOrder: order }).exec();
};

OrderSchema.statics.findCompletedUserRequests = function (user, status) {
  let query = { status, user, subOrder: { $ne: true } };

  console.log(query);
  return this.find(query)
    .distinct("transporter")
    .populate("user")
    .populate("transporter")
    .populate("rating")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .exec();
};

OrderSchema.statics.earningByTransporter = function (transporterId) {
  let query = { status: "delivered", transporter: transporterId };

  return this.find(query).populate("rates").exec();
};

OrderSchema.statics.earningByFilter = function (data) {
  let query = { status: "delivered" };
  if (data.transporterIds) {
    query.transporter = { $in: data.transporterIds };
  }

  if (data.startDate && data.endDate) {
    query.pickupDate = { $gte: data.startDate, $lte: data.endDate };
  }
  if (data.vehicles) {
    query.vehicle = { $in: data.vehicles };
  }
  if (data.pickup) {
    query["pickup.address"] = { $regex: data.pickup, $options: "i" };
  }
  if (data.dropoff) {
    query["dropoff.address"] = { $regex: data.dropoff, $options: "i" };
  }
  console.log(query);

  return this.find(query).populate("rates").exec();
};

OrderSchema.statics.earningByTransporterFilterByDate = function (data) {
  // console.log(data.transporterIds);
  let startDate = new Date(data.date);
  startDate.setDate(startDate.getDate() + 1);

  let endDate = new Date(data.date);
  return this.find({
    status: "delivered",
    transporter: { $in: data.transporterIds },
    pickupDate: { $lt: startDate, $gte: endDate },
  })
    .populate("rates")
    .exec();
  // let query = { status: "delivered" };
  // if (data.transporterIds) {
  //   query.transporter = { $in: data.transporterIds };
  // }

  // if (data.date) {
  //   // query.pickupDate = { $gte: data.startDate, $lte: data.endDate };
  //   query.pickupDate = { $lte: data.sdate, $gte: data.edate };
  // }
  // if (data.vehicles) {
  //   query.vehicle = { $in: data.vehicles };
  // }
  // if (data.pickup) {
  //   query["pickup.address"] = { $regex: data.pickup, $options: "i" };
  // }
  // if (data.dropoff) {
  //   query["dropoff.address"] = { $regex: data.dropoff, $options: "i" };
  // }
  // console.log(query);

  // return this.find(query).populate("rates").exec();
};

OrderSchema.statics.earningByTransporterFilterByMonth = function (data) {
  let startDate = new Date(data.date);
  let daysInMonth = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    0
  );
  daysInMonth = daysInMonth.getDate() - 1;

  let endDate = new Date(data.date);

  endDate.setDate(endDate.getDate() + daysInMonth);

  console.log(startDate);
  console.log(endDate);
  return this.find({
    status: "delivered",
    transporter: { $in: data.transporterIds },
    pickupDate: { $gte: startDate, $lte: endDate },
  })
    .populate("rates")
    .exec();
};

OrderSchema.statics.findByCommodityId = function (id) {
  let query = { commodities: { $in: [id] } };
  return this.find(query).exec();
};

OrderSchema.statics.findBySpace = function (id, status) {
  let query = {
    $or: [{ "pickup.space": id }, { "dropoff.space": id }],
  };
  if (status === "accepted") {
    query.status = { $in: ["accepted", "picked", "onmyway"] };
  } else if (status === "completed") {
    query.status = {
      $in: ["delivered"],
    };
  } else if (status === "cancelled") {
    query.status = {
      $in: ["cancelledbyuser", "cancelledbytransporter", "cancelledbyadmin"],
    };
  } else if (status === "delivered") {
    query.status = {
      $in: [
        "delivered",
        "cancelledbyuser",
        "cancelledbytransporter",
        "cancelledbyadmin",
        "cancelledbystore",
      ],
    };
  }
  return this.find(query).populate("rates").exec();
};

OrderSchema.statics.countBySpace = function (id) {
  let query = {
    $or: [{ "pickup.space": id }, { "dropoff.space": id }],
  };
  return this.count(query).exec();
};

OrderSchema.statics.findByCommoditiesAndUser = function (commodity, userId) {
  let query = {
    commodities: { $in: commodity },
    $or: [{ transporter: userId }, { user: userId }],
  };
  return this.find(query).exec();
};

OrderSchema.statics.updateOrderStatus = function (id, data) {
  if (data.status === "accepted") {
    data["timeLogs.accepted"] = new Date();
  } else if (data.status === "picked") {
    data["timeLogs.picked"] = new Date();
  } else if (data.status === "delivered") {
    data["timeLogs.delivered"] = new Date();
  } else if (
    data.status === "cancelled" ||
    data.status === "cancelledbytransporter" ||
    data.status === "cancelledbystore" ||
    data.status === "cancelledbyadmin"
  ) {
    data["timeLogs.cancelled"] = new Date();
  }
  return this.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });
};

OrderSchema.statics.updateById = function (id, data) {
  return this.findOneAndUpdate({ _id: id }, { $set: data }, { new: true });
};

OrderSchema.statics.addDispute = function (id, data) {
  return this.findOneAndUpdate(
    { _id: id },
    { $addToSet: { disputes: data } },
    { new: true }
  );
};

OrderSchema.statics.getCount = function () {
  return this.count({}).exec();
};

OrderSchema.statics.getMonthlyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
  return this.count({ createdAt: { $gte: last } }).exec();
};

OrderSchema.statics.getWeeklyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({ createdAt: { $gte: last } }).exec();
};

OrderSchema.statics.getCountCurrentDate = function () {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = today.getFullYear();
  return this.count({
    createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
  }).exec();
};

OrderSchema.statics.getOrderByStatusAndType = function (status, type) {
  if (status === "pendingOrders" && type === "currentCount") {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    let yyyy = today.getFullYear();
    return this.find({
      status: "pending",
      createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
    })
      .sort("-createdAt")
      .exec();
  } else if (status === "pendingOrders" && type === "weeklyCount") {
    let date = new Date();
    let last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.find({ status: "pending", createdAt: { $gte: last } })
      .sort("-createdAt")
      .exec();
  } else if (status === "pendingOrders" && type === "monthlyCount") {
    let date = new Date();
    let last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.find({ status: "pending", createdAt: { $gte: last } })
      .sort("-createdAt")
      .exec();
  } else if (status === "progressOrders" && type === "currentCount") {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    let yyyy = today.getFullYear();
    return this.find({
      status: { $in: ["accepted", "picked"] },
      createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
    })
      .sort("-createdAt")
      .exec();
  } else if (status === "progressOrders" && type === "weeklyCount") {
    let date = new Date();
    let last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.find({
      status: { $in: ["accepted", "picked"] },
      createdAt: { $gte: last },
    })
      .sort("-createdAt")
      .exec();
  } else if (status === "progressOrders" && type === "monthlyCount") {
    let date = new Date();
    let last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.find({
      status: { $in: ["accepted", "picked"] },
      createdAt: { $gte: last },
    })
      .sort("-createdAt")
      .exec();
  } else if (status === "deliveredOrders" && type === "currentCount") {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = String(today.getMonth() + 1).padStart(2, "0");
    let yyyy = today.getFullYear();
    return this.find({
      status: "delivered",
      createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
    })
      .sort("-createdAt")
      .exec();
  } else if (status === "deliveredOrders" && type === "weeklyCount") {
    let date = new Date();
    let last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.find({ status: "delivered", createdAt: { $gte: last } }).exec();
  } else if (status === "deliveredOrders" && type === "monthlyCount") {
    let date = new Date();
    let last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.find({ status: "delivered", createdAt: { $gte: last } }).exec();
  } else if (status === "all" && type === "currentCount") {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    let yyyy = today.getFullYear();
    return this.find({
      createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
    }).exec();
  } else if (status === "all" && type === "weeklyCount") {
    let date = new Date();
    let last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.find({ createdAt: { $gte: last } }).exec();
  } else if (status === "all" && type === "monthlyCount") {
    let date = new Date();
    let last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.find({ createdAt: { $gte: last } }).exec();
  } else if (status === "pendingOrders") {
    return this.find({ status: "pending" }).sort("-createdAt").exec();
  } else if (status === "progressOrders") {
    return this.find({ status: { $in: ["accepted", "picked"] } })
      .sort("-createdAt")
      .exec();
  } else if (status === "deliveredOrders") {
    return this.find({ status: "delivered" }).sort("-createdAt").exec();
  } else {
    return this.find({}).sort("-createdAt").populate("store").exec();
  }
};

OrderSchema.statics.getPendingCount = function () {
  return this.count({ status: "pending" }).exec();
};

OrderSchema.statics.getPendingMonthlyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
  return this.count({ status: "pending", createdAt: { $gte: last } }).exec();
};

OrderSchema.statics.getPendingWeeklyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({ status: "pending", createdAt: { $gte: last } }).exec();
};

OrderSchema.statics.getPendingCountCurrentDate = function () {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = today.getFullYear();
  return this.count({
    status: "pending",
    createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
  }).exec();
};

OrderSchema.statics.getInprogressCount = function () {
  return this.count({ status: { $in: ["accepted", "picked"] } }).exec();
};

OrderSchema.statics.getInprogressMonthlyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
  return this.count({
    status: { $in: ["accepted", "picked"] },
    createdAt: { $gte: last },
  }).exec();
};

OrderSchema.statics.getInprogressWeeklyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({
    status: { $in: ["accepted", "picked"] },
    createdAt: { $gte: last },
  }).exec();
};

OrderSchema.statics.getInprogressCountCurrentDate = function () {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = today.getFullYear();
  return this.count({
    status: { $in: ["accepted", "picked"] },
    createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
  }).exec();
};

OrderSchema.statics.getDeliveredCount = function () {
  return this.count({ status: "delivered" }).exec();
};

OrderSchema.statics.getDeliveredMonthlyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
  return this.count({ status: "delivered", createdAt: { $gte: last } }).exec();
};

OrderSchema.statics.getDeliveredWeeklyCount = function () {
  var date = new Date();
  var last = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
  return this.count({ status: "delivered", createdAt: { $gte: last } }).exec();
};

OrderSchema.statics.getDeliveredCountCurrentDate = function () {
  let today = new Date();
  let dd = String(today.getDate()).padStart(2, "0");
  let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = today.getFullYear();
  return this.count({
    status: "delivered",
    createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
  }).exec();
};

OrderSchema.statics.getNewCountBetweenDates = function (start, end) {
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

OrderSchema.statics.getCountBetweenDatesByUser = function (user, data) {
  let matchQuery = { user: mongoose.Types.ObjectId(user) };
  if (data.startDate && data.endDate) {
    matchQuery.pickupDate = {
      $lte: new Date(data.endDate),
      $gte: new Date(data.startDate),
    };
  } else {
    let date = new Date();
    matchQuery.pickupDate = {
      $gte: new Date().setFullYear(
        date.getFullYear() - 1,
        date.getMonth(),
        date.getDate()
      ),
      $lte: new Date().setHours(23, 59, 59, 0),
    };
  }
  if (data.status) {
    const status = data.status;
    if (status === "accepted") {
      matchQuery.status = { $in: ["accepted", "picked"] };
    } else if (status === "cancelled") {
      matchQuery.status = {
        $in: [
          "cancelledbyuser",
          "cancelledbytransporter",
          "cancelledbyadmin",
          "cancelledbystore",
        ],
      };
    } else if (status === "delivered") {
      matchQuery.status = "delivered";
    } else if (status === "pending") {
      matchQuery.status = "pending";
    }
  }
  let group = {};
  if (data.period === "yearly") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
      },
    };
  } else if (data.period === "monthly") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
        month: { $month: "$pickupDate" },
      },
    };
  } else if (data.period === "daily") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
        month: { $month: "$pickupDate" },
        day: { $dayOfMonth: "$pickupDate" },
      },
    };
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        ...group,
        count: { $sum: 1 },
      },
    },
  ]);
};

OrderSchema.statics.getCountBetweenDatesByTransporter = function (
  transporterIds,
  data
) {
  let matchQuery = { transporter: { $in: transporterIds } };
  if (data.startDate && data.endDate) {
    matchQuery.pickupDate = {
      $lte: new Date(data.endDate),
      $gte: new Date(data.startDate),
    };
  } else {
    let date = new Date();
    matchQuery.pickupDate = {
      $gte: new Date().setFullYear(
        date.getFullYear() - 1,
        date.getMonth(),
        date.getDate()
      ),
      $lte: new Date().setHours(23, 59, 59, 0),
    };
  }
  if (data.status) {
    const status = data.status;
    if (status === "accepted") {
      matchQuery.status = { $in: ["accepted", "picked"] };
    } else if (status === "cancelled") {
      matchQuery.status = {
        $in: [
          "cancelledbyuser",
          "cancelledbytransporter",
          "cancelledbyadmin",
          "cancelledbystore",
        ],
      };
    } else if (status === "delivered") {
      matchQuery.status = "delivered";
    } else if (status === "pending") {
      matchQuery.status = "pending";
    }
  }
  let group = {};
  if (data.period === "yearly") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
      },
    };
  } else if (data.period === "monthly") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
        month: { $month: "$pickupDate" },
      },
    };
  } else if (data.period === "daily") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
        month: { $month: "$pickupDate" },
        day: { $dayOfMonth: "$pickupDate" },
      },
    };
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        ...group,
        count: { $sum: 1 },
      },
    },
  ]);
};

OrderSchema.statics.returnOrderCountsByStore = function (store, data) {
  let matchQuery = { isReturnOrder: data.isReturnOrder };
  if (data.startDate && data.endDate) {
    matchQuery.pickupDate = {
      $lte: new Date(data.endDate),
      $gte: new Date(data.startDate),
    };
  } else {
    let date = new Date();
    matchQuery.pickupDate = {
      $gte: new Date().setFullYear(
        date.getFullYear() - 1,
        date.getMonth(),
        date.getDate()
      ),
      $lte: new Date().setHours(23, 59, 59, 0),
    };
  }
  if (data.status) {
    const status = data.status;
    if (status === "accepted") {
      matchQuery.status = { $in: ["accepted", "picked"] };
    } else if (status === "cancelled") {
      matchQuery.status = {
        $in: [
          "cancelledbyuser",
          "cancelledbytransporter",
          "cancelledbyadmin",
          "cancelledbystore",
        ],
      };
    } else if (status === "delivered") {
      matchQuery.status = "delivered";
    } else if (status === "pending") {
      matchQuery.status = "pending";
    }
  }
  let group = {};
  if (data.period === "yearly") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
      },
    };
  } else if (data.period === "monthly") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
        month: { $month: "$pickupDate" },
      },
    };
  } else if (data.period === "daily") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
        month: { $month: "$pickupDate" },
        day: { $dayOfMonth: "$pickupDate" },
      },
    };
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        ...group,
        count: { $sum: 1 },
      },
    },
  ]);
};

OrderSchema.statics.shippedOrderCountsByStore = function (store, data) {
  // console.log(data);
  let matchQuery = { isReturnOrder: data.isReturnOrder };
  // let matchQuery = {};
  if (data.startDate && data.endDate) {
    matchQuery.pickupDate = {
      $lte: new Date(data.endDate),
      $gte: new Date(data.startDate),
    };
  } else {
    let date = new Date();
    matchQuery.pickupDate = {
      $gte: new Date().setFullYear(
        date.getFullYear() - 1,
        date.getMonth(),
        date.getDate()
      ),
      $lte: new Date().setHours(23, 59, 59, 0),
    };
  }
  if (data.status) {
    const status = data.status;
    if (status === "accepted") {
      matchQuery.status = { $in: ["accepted", "picked"] };
    } else if (status === "cancelled") {
      matchQuery.status = {
        $in: [
          "cancelledbyuser",
          "cancelledbytransporter",
          "cancelledbyadmin",
          "cancelledbystore",
        ],
      };
    } else if (status === "delivered") {
      matchQuery.status = "delivered";
    } else if (status === "pending") {
      matchQuery.status = "pending";
    }
  }
  let group = {};
  if (data.period === "yearly") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
      },
    };
  } else if (data.period === "monthly") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
        month: { $month: "$pickupDate" },
      },
    };
  } else if (data.period === "daily") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
        month: { $month: "$pickupDate" },
        day: { $dayOfMonth: "$pickupDate" },
      },
    };
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        ...group,
        count: { $sum: 1 },
      },
    },
  ]);
};

OrderSchema.statics.getEarningBetweenDatesByTransporter = function (
  transporterIds,
  data
) {
  let matchQuery = { transporter: transporterIds };
  if (data.startDate && data.endDate) {
    matchQuery.pickupDate = {
      $lte: new Date(data.endDate),
      $gte: new Date(data.startDate),
    };
  } else {
    let date = new Date();
    matchQuery.pickupDate = {
      $gte: new Date().setFullYear(
        date.getFullYear() - 1,
        date.getMonth(),
        date.getDate()
      ),
      $lte: new Date().setHours(23, 59, 59, 0),
    };
  }
  if (data.status) {
    const status = data.status;
    if (status === "accepted") {
      matchQuery.status = { $in: ["accepted", "picked"] };
    } else if (status === "cancelled") {
      matchQuery.status = {
        $in: [
          "cancelledbyuser",
          "cancelledbytransporter",
          "cancelledbyadmin",
          "cancelledbystore",
        ],
      };
    } else if (status === "delivered") {
      matchQuery.status = "delivered";
    } else if (status === "pending") {
      matchQuery.status = "pending";
    }
  }
  console.log(matchQuery);
  let group = {};
  if (data.period === "yearly") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
      },
    };
  } else if (data.period === "monthly") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
        month: { $month: "$pickupDate" },
      },
    };
  } else if (data.period === "daily") {
    group = {
      _id: {
        year: { $year: "$pickupDate" },
        month: { $month: "$pickupDate" },
        day: { $dayOfMonth: "$pickupDate" },
      },
    };
  }
  console.log(group);

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        ...group,
        total: { $sum: "$price" },
      },
    },
  ]);
};

OrderSchema.statics.countByToday = function () {
  return this.count({
    createdAt: {
      $gte: new Date().setHours(0, 0, 0, 0),
      $lte: new Date().setHours(23, 59, 59, 0),
    },
  }).exec();
};

OrderSchema.statics.returnCountByStoreAndDate = function (
  startDate,
  endDate,
  store,
  isReturnOrder
) {
  return this.count({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
    isReturnOrder,
    store,
  }).exec();
};

OrderSchema.statics.shippedCountByStoreAndDate = function (
  startDate,
  endDate,
  store
) {
  // console.log(store);
  return this.count({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
    store,
    status: { $in: "delivered" },
  }).exec();
};

OrderSchema.statics.countByUserAndStatus = function (user, status) {
  let matchQuery = { user: mongoose.Types.ObjectId(user) };
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

OrderSchema.statics.countByTransporterAndStatus = function (
  transporterIds,
  status
) {
  let matchQuery = { transporter: { $in: transporterIds } };
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

OrderSchema.statics.countByTransporterAndUser = function (transporter, user) {
  let matchQuery = { transporter: mongoose.Types.ObjectId(transporter) };
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$user",
        count: { $sum: 1 },
      },
    },
  ]);
};

OrderSchema.statics.search = function (data, text) {
  let query = { $or: [] };
  if (data.active != undefined) {
    query.active = data.active;
  }
  if (data.status) {
    // query.status = data.status;
    query.$or.push({ status: text });
  }

  if (data.orderNumber) {
    query.$or.push({ orderNumber: text });
    // query.orderNumber = data.orderNumber;
  }

  if (text) {
    query.$or.push({ "pickup.address": { $regex: text, $options: "i" } });
  }
  if (text) {
    query.$or.push({ "dropoff.address": { $regex: text, $options: "i" } });
  }
  if (text) {
    query.$or.push({
      "returnAddress.address": { $regex: text, $options: "i" },
    });
  }
  if (text) {
    query.$or.push({ "contact.name": { $regex: text, $options: "i" } });
  }
  if (text) {
    query.$or.push({ "contact.firstName": { $regex: text, $options: "i" } });
  }
  if (text) {
    query.$or.push({ "contact.lastName": { $regex: text, $options: "i" } });
  }
  if (text) {
    query.$or.push({ "contact.number": { $regex: text, $options: "i" } });
  }
  if (text) {
    query.$or.push({ "contact.email": { $regex: text, $options: "i" } });
  }

  console.log(query);

  return this.find(query)
    .populate("user")
    .populate("transporter")
    .populate("previousTransporter")
    .populate("promo")
    .populate("rating")
    .populate("customerRating")
    .populate("rates")
    .populate({ path: "commodities", populate: { path: "itemType" } })
    .populate({ path: "routes", populate: { path: "transporter" } })

    .exec();
};

OrderSchema.statics.findOrdersByTransporter = function (id) {
  return this.find({
    transporter: { _id: id },
    status: { $in: ["picked", "onmyway"] },
  }).populate("rates");
};

OrderSchema.statics.detailCount = function (id, start, end) {
  return this.aggregate([
    {
      $match: {
        store: mongoose.Types.ObjectId(id),
        // status: "delivered",
        createdAt: { $lte: end },
        createdAt: { $gte: start },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        cnt: { $sum: 1 },
      },
      // $group: { _id: null, count: { $sum: 1 } },
    },
    {
      $sort: { _id: -1 },
    },
    {
      $addFields: { date: "$_id" },
    },
    {
      $project: { _id: 0 },
    },
  ]);
};

OrderSchema.statics.totalCount = function (id, start, end) {
  return this.aggregate([
    {
      $match: {
        store: mongoose.Types.ObjectId(id),
        // status: "delivered",
        createdAt: { $lte: end },
        createdAt: { $gte: start },
      },
    },
    {
      $group: { _id: null, count: { $sum: 1 } },
    },
    {
      $sort: { _id: -1 },
    },
    // {
    //   $addFields: { my_new_id_name: "$_id" }
    // },
    {
      $project: { _id: 0 },
    },
  ]);
};

OrderSchema.statics.ordersByStatus = function (id, start, end) {
  return this.aggregate([
    {
      $match: {
        store: mongoose.Types.ObjectId(id),
        createdAt: { $lte: end },
        createdAt: { $gte: start },
      },
    },
    {
      $group: {
        _id: "$status",
        numberOfOrders: { $sum: 1 },
      },
    },
    {
      $addFields: { status: "$_id" },
    },
    {
      $project: { _id: 0 },
    },
  ]);
};

// Store total orders start

OrderSchema.statics.numberOfOrders = async function (storeId) {
  const stats = await this.aggregate([
    {
      $match: { store: storeId },
    },
    {
      $group: {
        _id: "$store",
        nOrders: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Store.findByIdAndUpdate(storeId, {
      totalOrders: stats[0].nOrders,
    });
  } else {
    await Store.findByIdAndUpdate(storeId, {
      totalOrders: 0,
    });
  }
};

OrderSchema.post("save", function () {
  this.constructor.numberOfOrders(this.store);
});

OrderSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

OrderSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.numberOfOrders(this.r.store);
});

// Store total orders complete

//  Transporter total orders start
OrderSchema.statics.numberOfOrdersForTransporter = async function (
  transporterId
) {
  const stats = await this.aggregate([
    {
      $match: { transporter: transporterId },
    },
    {
      $group: {
        _id: "$transporter",
        nOrders: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Transporter.findByIdAndUpdate(transporterId, {
      totalOrders: stats[0].nOrders,
    });
  } else {
    await Transporter.findByIdAndUpdate(transporterId, {
      totalOrders: 0,
    });
  }
};

OrderSchema.post("save", function () {
  this.constructor.numberOfOrdersForTransporter(this.transporter);
});

OrderSchema.pre(/^findOneAnd/, async function (next) {
  this.f = await this.findOne();
  next();
});

OrderSchema.post(/^findOneAnd/, async function () {
  await this.f.constructor.numberOfOrdersForTransporter(this.f.transporter);
});

// Transporter total orders complete

//  Customer total orders start
OrderSchema.statics.numberOfOrdersForCustomer = async function (userId) {
  const stats = await this.aggregate([
    {
      $match: { user: userId },
    },
    {
      $group: {
        _id: "$user",
        nOrders: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(userId, {
      totalOrders: stats[0].nOrders,
    });
  } else {
    await User.findByIdAndUpdate(userId, {
      totalOrders: 0,
    });
  }
};

OrderSchema.post("save", function () {
  this.constructor.numberOfOrdersForCustomer(this.user);
});

OrderSchema.pre(/^findOneAnd/, async function (next) {
  this.f = await this.findOne();
  next();
});

OrderSchema.post(/^findOneAnd/, async function () {
  await this.f.constructor.numberOfOrdersForCustomer(this.f.user);
});
// Customer total orders complete

OrderSchema.statics.transportersPendingOrPaidStatus = async function (
  transporter = null
) {
  let query = {};
  if (transporter) {
    query = {
      status: { $eq: "delivered" },
      transporter: mongoose.Types.ObjectId(transporter),
    };
  } else {
    query = { status: { $eq: "delivered" }, transporter: { $ne: null } };
  }
  return await this.aggregate([
    { $match: query },
    {
      $lookup: {
        from: "transporters",
        localField: "transporter",
        foreignField: "_id",
        as: "trans",
      },
    },
    {
      $lookup: {
        from: "earnings",
        localField: "transporter",
        foreignField: "transporters",
        as: "er",
      },
    },
    {
      $lookup: {
        from: "rates",
        localField: "rates",
        foreignField: "_id",
        as: "ra",
      },
    },
    {
      $lookup: {
        from: "finances",
        localField: "_id",
        foreignField: "order",
        as: "fa",
      },
    },
    {
      $project: { trans: 1, ra: 1, fa: 1, er: 1 },
    },
    {
      $unwind: "$trans",
    },
    {
      $unwind: "$ra",
    },
    {
      $unwind: "$fa",
    },
    {
      $unwind: "$er",
    },
    {
      $project: {
        "trans._id": 1,
        "trans.firstName": 1,
        "trans.lastName": 1,
        "trans.mobile": 1,
        "trans.email": 1,
        "fa.amount": 1,
        "fa.status": 1,
        "ra.total": 1,
        "er.percentage": 1,
      },
    },
    {
      $group: {
        _id: { transporter: "$trans._id", financeStatus: "$fa.status" },
        firstName: { $first: "$trans.firstName" },
        lastName: { $first: "$trans.lastName" },
        mobile: { $first: "$trans.mobile" },
        email: { $first: "$trans.email" },
        totalOrders: { $sum: 1 },
        amount: { $sum: "$fa.amount" },
        total: { $sum: "$ra.total" },
        percentage: { $first: "$er.percentage" },
      },
    },
    {
      $project: {
        transporter: "$_id",
        firstName: "$firstName",
        lastName: "$lastName",
        mobile: "$mobile",
        email: "$email",
        transporter: "$_id.transporter",
        financeStatus: "$_id.financeStatus",
        totalOrders: "$totalOrders",
        amount: "$amount",
        total: "$total",
        percentage: "$percentage",
        _id: 0,
      },
    },
    {
      $addFields: {
        paidOrders: {
          $cond: [{ $eq: ["$financeStatus", "paid"] }, "$totalOrders", 0],
        },
      },
    },
    {
      $addFields: {
        dueOrders: {
          $cond: [{ $eq: ["$financeStatus", "pending"] }, "$totalOrders", 0],
        },
      },
    },
    {
      $addFields: {
        paidAmount: {
          $cond: [{ $eq: ["$financeStatus", "paid"] }, "$amount", 0],
        },
      },
    },
    {
      $addFields: {
        dueAmount: {
          $cond: [{ $eq: ["$financeStatus", "pending"] }, "$amount", 0],
        },
      },
    },
    {
      $group: {
        _id: "$transporter",
        firstName: { $first: "$firstName" },
        lastName: { $first: "$lastName" },
        mobile: { $first: "$mobile" },
        email: { $first: "$email" },
        totalMin: { $min: "$total" },
        totalMax: { $max: "$total" },
        paidOrders: { $max: "$paidOrders" },
        dueOrders: { $max: "$dueOrders" },
        paidAmount: { $max: "$paidAmount" },
        dueAmount: { $max: "$dueAmount" },
        percentage: { $first: "$percentage" },
      },
    },
    {
      $project: {
        percentage: "$percentage",
        totalOrders: { $add: ["$paidOrders", "$dueOrders"] },
        totalOrdersAmount: { $add: ["$paidAmount", "$dueAmount"] },
        paidOrders: "$paidOrders",
        paidOrdersAmount: "$paidAmount",
        dueOrders: "$dueOrders",
        dueOrdersAmount: "$dueAmount",
        transporter: {
          _id: "$_id",
          firstName: "$firstName",
          lastName: "$lastName",
          mobile: "$mobile",
          email: "$email",
        },
        _id: 0,
      },
    },
  ]);
};

module.exports = mongoose.model("Order", OrderSchema);
