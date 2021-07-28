var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ModificationLogSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    commodity: { type: Schema.Types.ObjectId, ref: "Commodity" },
    changelog: Object,
    isCommodity: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    updatedByCustomer: { type: Schema.Types.ObjectId, ref: "User" },
    updatedByTransporter: { type: Schema.Types.ObjectId, ref: "Transporter" },
    confirmationCode: Number,
    type: String, //modify, reschedule, location, commodities, price_change
    status: { type: String, default: "pending" }
  },
  { timestamps: true }
);

ModificationLogSchema.statics.findByOrder = function(params) {
  let query = { order: params.id };
  if (params.status != "all") {
    query.status = params.status;
  }
  return this.find(query)
    .populate("updatedBy")
    .exec();
};

ModificationLogSchema.statics.findByOrderAndCode = function(id, code) {
  return this.findOne({ order: id, confirmationCode: code }).exec();
};

ModificationLogSchema.statics.findById = function(id) {
  return this.findOne({ _id: id }).exec();
};

module.exports = mongoose.model("ModificationLog", ModificationLogSchema);
