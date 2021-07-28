"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var BankAccountSchema = new Schema(
  {
    bank: String,
    title: String,
    currency: String,
    country: String,
    iban: { type: String, required: [true, "IBAN required"], unique: true },
    defaultAccount: { type: Boolean, default: false },
    user: { type: Schema.ObjectId, ref: "Transporter" },
  },
  { timestamps: true }
);

BankAccountSchema.statics.markInactiveByUser = function (user) {
  return this.update(
    { user: user },
    { defaultAccount: false },
    { multi: true }
  );
};

BankAccountSchema.statics.markActiveById = function (id) {
  return this.findOneAndUpdate({ _id: id }, { defaultAccount: true });
};

BankAccountSchema.statics.findByUser = function (id) {
  return this.find({ user: id }).sort({ defaultAccount: -1 });
};

BankAccountSchema.pre("save", function (next) {
  if (this.defaultAccount === true) {
    this.constructor
      .update({}, { $set: { defaultAccount: false } }, { multi: true })
      .then((cats) => {
        next();
      });
  } else {
    next();
  }
});

module.exports = mongoose.model("BankAccount", BankAccountSchema);
