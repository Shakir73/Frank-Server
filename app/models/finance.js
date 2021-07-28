"use strict";

var mongoose = require("mongoose");
const { async } = require("q");
const Order = require("./order");
const Transporter = require("./transporter");
const BankAccount = require("./bank");
const { schema } = require("./store");
var Schema = mongoose.Schema;

/**
 * Finance Schema
 */
var FinanceSchema = new Schema(
  {
    amount: Number,
    status: String,
    lastPaidAmount: { type: Number, default: 0 },
    lastPaidDate: Date,
    lastPaidBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    transporter: { type: Schema.Types.ObjectId, ref: "Transporter" },
    bankAccount: { type: Schema.Types.ObjectId, ref: "BankAccount" },
  },
  { timestamps: true }
);

FinanceSchema.statics.findById = function (id) {
  return this.findOne({ _id: id })
    .populate({
      path: "transporter",
      populate: { path: "bankInfo" },
    })
    .populate("orders")
    .populate({ path: "orders" })
    .populate({ path: "orders", populate: { path: "user" } })
    .populate({ path: "orders", populate: { path: "rates" } })
    .sort({ createdAt: -1 })
    .exec();
};

FinanceSchema.statics.findByTransporter = function (profileId) {
  return (
    this.find({ transporter: profileId })
      .populate({ path: "orders" })
      .populate({ path: "orders", populate: { path: "user" } })
      .populate({ path: "orders", populate: { path: "rates" } })
      // .populate({ path: "bankAccount", select: 'iban _id' })
      .populate({
        path: "transporter",
        select: "firstName lastName email mobile",
        populate: { path: "bankInfo", select: "iban" },
      })
      .sort({ createdAt: -1 })
      .exec()
  );
};

FinanceSchema.statics.findPendingByTransporter = function (profileId) {
  return this.findOne({ transporter: profileId, status: "pending" })
    .populate("orders")
    .sort({ createdAt: -1 })
    .exec();
};

FinanceSchema.statics.findByOrder = function (orders) {
  return this.find({ orders: { $in: orders } })
    .populate({
      path: "transporter",
      populate: { path: "bankInfo" },
    })
    .populate("orders")
    .sort({ createdAt: -1 })
    .exec();
};

FinanceSchema.statics.findByOrderId = function (orders) {
  return (
    this.find({ orders: { $in: orders } })
      .populate({
        path: "transporter",
        populate: { path: "bankInfo" },
      })
      // .populate("orders")
      .sort({ createdAt: -1 })
      .exec()
  );
};

FinanceSchema.statics.updateStatus = function (id, transporter, order, data) {
  return this.findOneAndUpdate(
    { _id: id, transporter, order },
    { $set: data },
    { new: true }
  )
    .populate({
      path: "transporter",
      populate: { path: "bankInfo" },
    })
    .populate("bankAccount")
    .sort({ createdAt: -1 })
    .exec();
};

FinanceSchema.statics.findUnpaid = function () {
  return this.find({ status: "pending" })
    .populate({
      path: "transporter",
      populate: { path: "bankInfo" },
    })
    .populate("orders")
    .sort({ createdAt: -1 })
    .exec();
};

FinanceSchema.statics.findAll = function () {
  return this.find({})
    .populate({
      path: "transporter",
      select: "transporterType active firstName lastName email mobile",
      populate: { path: "bankInfo", select: "iban bank" },
    })
    .sort({ createdAt: -1 })
    .exec();
};

FinanceSchema.statics.findAfterTime = function (time) {
  return this.find({ time: { $gte: time } })
    .populate("transporter")
    .populate("orders")
    .exec();
};

FinanceSchema.statics.findByTransporterBetweenTime = function (
  transporter,
  start,
  end
) {
  return this.find({
    transporter,
    $and: [{ time: { $gte: start } }, { time: { $lte: end } }],
  }).exec();
};

FinanceSchema.statics.transportersDetails = function (data) {
  return this.find({ transporter: { $in: data } });
};

FinanceSchema.statics.getStatus = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$transporter",
        amount: { $sum: "$amount" },
        lastPaid: { $addToSet: "$lastPaidAmount" },
        lastPaidDate: { $addToSet: "$lastPaidDate" },
        orders: { $sum: 1 },
        status: { $addToSet: "$status" },
        bankAccount: { $addToSet: "$bankAccount" },
      },
    },
    {
      $project: {
        transporter: "$_id",
        amount: "$amount",
        lastPaid: "$lastPaid",
        lastPaidDate: "$lastPaidDate",
        orders: "$orders",
        status: "$status",
        bank: "$bankAccount",
        _id: 0,
      },
    },
    {
      $lookup: {
        from: Transporter.collection.name,
        localField: "transporter",
        foreignField: "_id",
        as: "transporter",
      },
    },
    {
      $lookup: {
        from: BankAccount.collection.name,
        localField: "bank",
        foreignField: "_id",
        as: "bank",
      },
    },
  ]);
};

FinanceSchema.statics.getTransporterStatus = function (data) {
  return this.aggregate([
    {
      $lookup: {
        from: Transporter.collection.name,
        localField: "transporter",
        foreignField: "_id",
        as: "tr",
      },
    },
    {
      $lookup: {
        from: BankAccount.collection.name,
        localField: "bankAccount",
        foreignField: "_id",
        as: "bk",
      },
    },
    {
      $unwind: {
        path: "$bankAccount",
        preserveNullAndEmptyArrays: true,
      },
    },

    { $unwind: "$tr" },
    {
      $project: {
        transporter: 1,
        lastPaidAmount: 1,
        order: 1,
        status: 1,
        amount: 1,
        bankAccount: 1,
        name: { $concat: ["$tr.firstName", " ", "$tr.lastName"] },
        iban: "$bk.iban",
      },
    },
    {
      $unwind: {
        path: "$iban",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$transporter",
        name: { $first: "$name" },
        iban: { $addToSet: "$iban" },
        totalAmount: { $sum: "$amount" },
        totalJobs: { $sum: 1 },
      },
    },
    {
      $unwind: {
        path: "$iban",
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);
};

FinanceSchema.statics.transporterPaidUnPaidStatus = async function (
  transporter,
  status
) {
  return await this.aggregate([
    { $match: { transporter: mongoose.Types.ObjectId(transporter), status } },
    {
      $lookup: {
        from: Order.collection.name,
        localField: "order",
        foreignField: "_id",
        as: "od",
      },
    },
    { $unwind: "$od" },
    {
      $project: {
        trackingID: "$od.orderNumber",
        orderStatus: "$od.status",
        deliveryType: "$od.deliveryType",
        order_id: "$order",
        amount: "$amount",
        transporter: "$transporter",
      },
    },
    {
      $group: {
        _id: {
          trackingID: "$trackingID",
          orderStatus: "$orderStatus",
          deliveryType: "$deliveryType",
        },
        orderSize: { $sum: 1 },
        amount: { $sum: "$amount" },
      },
    },
    {
      $project: {
        trackingID: "$_id.trackingID",
        orderStatus: "$_id.orderStatus",
        deliveryType: "$_id.deliveryType",
        orderSize: 1,
        amount: 1,
        _id: 0,
      },
    },
  ]);
};
module.exports = mongoose.model("Finance", FinanceSchema);
