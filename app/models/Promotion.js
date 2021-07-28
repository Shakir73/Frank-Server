const moment = require("moment");
const mongoose = require("mongoose");
const Order = require("./order");

const PromotionSchema = new mongoose.Schema(
  {
    orders: [{ type: mongoose.Schema.ObjectId, ref: "Order" }],
    transporters: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Transporter",
        required: [true, "Promotion must have transport"],
      },
    ],
    allTransporters: { type: Boolean, default: false },
    allOrders: { type: Boolean, default: false },
    discountType: {
      type: String,
      required: [true, "Promotion must have discount type"],
      enum: ["percentage", "amount"],
    },
    discount: {
      type: Number,
      required: [true, "Promotion must have discount"],
      min: 1,
    },
    startDate: {
      type: Date,
      required: [true, "Promotion must have start data"],
    },
    endDate: {
      type: Date,
      required: [true, "Promotion must have end date"],
    },
    maxOrders: Number,
    text: String,
    active: { type: Boolean, default: true, select: false },
    logger: [
      {
        addedBy: {
          type: mongoose.Schema.ObjectId,
          ref: "Admin",
          required: true,
        },
        createdAt: {
          type: Date,
          default: new Date(),
        },
      },
    ],
  },
  { timestamps: true }
);

PromotionSchema.statics.checkPromotions = async function (transporter) {
  let today = moment(new Date()).format("YYYY-MM-DD");
  today = new Date(today);
  return this.findOne({
    transporters: { $in: transporter },
    endDate: { $gte: today },
  })
    .select("discountType discount maxOrders")
    .sort({
      createdAt: -1,
    });
};

PromotionSchema.statics.checkPromotion = async function (transporter) {
  let today = moment(new Date()).format("YYYY-MM-DD");
  today = new Date(today);
  let checkPromotion = await this.aggregate([
    // {
    //   $match: { endDate: { $gte: today } },
    // },
    { $unwind: "$transporters" },
    {
      $match: {
        endDate: { $gte: today },
        transporters: mongoose.Types.ObjectId(transporter),
      },
    },
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "promotion",
        as: "ods",
      },
    },
    { $unwind: "$ods" },
    {
      $match: { "ods.status": "delivered" },
    },
    {
      $match: {
        $expr: { $lte: ["$ods.timeLogs.picked", "$endDate"] },
      },
    },
    {
      $group: {
        _id: "$_id",
        discountType: { $first: "$discountType" },
        discount: { $first: "$discount" },
        maxOrders: { $first: "$maxOrders" },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        $expr: { $gt: ["$maxOrders", "$count"] },
      },
    },
  ]);
  return checkPromotion[0] || {};
  return checkPromotion;
};

module.exports = mongoose.model("Promotion", PromotionSchema);
