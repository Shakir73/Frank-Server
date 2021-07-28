const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const StoreUserSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.ObjectId, ref: "Store" },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String },
    countryCode: { type: String },
    mobile: { type: String, required: true, unique: true },
    language: { type: String, required: true, default: 'eng' },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please provide confirm your password"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same!",
      },
    },
    role: {
      type: mongoose.Schema.ObjectId,
      ref: "Role",
      required: [true, "User must have a role."],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StoreUserSchema.pre("save", function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`;
  next();
});

StoreUserSchema.pre(/^find/, function (next) {
  this.populate({ path: "role", select: "name" });
  next();
});

StoreUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

StoreUserSchema.methods.comparePassword = async function (
  bodyPassword,
  databasePassword
) {
  return await bcrypt.compare(bodyPassword, databasePassword);
};

module.exports = mongoose.model("StoreUser", StoreUserSchema);
