"use strict";

const mongoose = require("mongoose");

const EarningSchema = new mongoose.Schema(
  {
    percentage: Number,
    transporters: { type: mongoose.Schema.ObjectId, ref: "Transporter" },
    active: { type: Boolean, default: true },

    logger: [
      {
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        createdAt: {
          type: Date,
          default: new Date(),
        },
      },
    ],
  },
  { timestamps: true }
);

EarningSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

EarningSchema.pre(/^find/, function (next) {
  this.find().populate({
    path: "transporters",
    select: "firstName lastName email mobile",
  }).select('percentage transporters');
  next();
});

module.exports = mongoose.model("Earning", EarningSchema);
