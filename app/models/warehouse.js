"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var WarehouseSchema = new Schema(
  {
    name: String,
    address: String,
    city: String,
    country: String,
    location: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ["Point"], // 'location.type' must be 'Point'
      },
      coordinates: {
        type: [Number],
      },
    },
    deleted: { type: Boolean, default: false },
    store: { type: Schema.Types.ObjectId, ref: "Store" },
  },
  { timestamps: true }
);

WarehouseSchema.statics.findByStore = function (store) {
  return this.find({ store }).exec();
};

WarehouseSchema.statics.deleteWarehouse = function (id, store) {
  return this.deleteMany({ _id: id, store }).exec();
};

module.exports = mongoose.model("Warehouse", WarehouseSchema);
