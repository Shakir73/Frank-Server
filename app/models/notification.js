"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * User Schema
 */
var NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: "User"
    },
    transporter: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: "Transporter"
    },
    order: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: "Order"
    },
    modificationLog: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: "ModificationLog"
    },
    status: { type: String, default: "new" },
    read: { type: Boolean, default: false },
    type: String,
    message: String
  },
  {
    timestamps: true
  }
);

NotificationSchema.statics.updateStatus = function(id, data) {
  return this.findOneAndUpdate(
    {
      _id: mongoose.Types.ObjectId(id)
    },
    {
      $set: {
        status: data.status
      }
    }
  )
    .populate("order")
    .populate("user")
    .populate("transporter")
    .exec();
};

NotificationSchema.statics.markRead = function(id, flag) {
  const update = flag
    ? {
        read: true,
        status: "read"
      }
    : {
        read: false,
        status: "new"
      };
  console.log(update);
  return this.findOneAndUpdate(
    {
      _id: mongoose.Types.ObjectId(id)
    },
    {
      $set: update
    },
    { new: true }
  )
    .populate("order")
    .populate("user")
    .populate("transporter")
    .exec();
};

NotificationSchema.statics.findByReceiverId = function(receiverId) {
  return this.find({
    $or: [
      {
        user: receiverId,
        type: {
          $in: [
            "accepted",
            "picked",
            "delivered",
            "route",
            "onmyway",
            "cancelledbytransporter",
            "cancelledbyadmin",
            "reschedule",
            "price_change"
          ]
        }
      },
      {
        transporter: receiverId,
        type: {
          $in: [
            "cancelledbyuser",
            "cancelledbyadmin",
            "assigned",
            "reschedule",
            "change_location"
          ]
        }
      }
    ]
  })
    .populate("order")
    .populate("user")
    .populate("transporter")
    .limit(30)
    .sort({
      createdAt: -1
    })
    .exec();
};

NotificationSchema.statics.countByReceiverId = function(receiverId) {
  return this.count({
    read: false,
    $or: [
      {
        user: receiverId,
        type: {
          $in: [
            "accepted",
            "picked",
            "delivered",
            "route",
            "onmyway",
            "cancelledbytransporter",
            "cancelledbyadmin",
            "reschedule",
            "price_change"
          ]
        }
      },
      {
        transporter: receiverId,
        type: {
          $in: [
            "cancelledbyuser",
            "cancelledbyadmin",
            "assigned",
            "reschedule",
            "change_location"
          ]
        }
      }
    ]
  }).exec();
};

module.exports = mongoose.model("Notification", NotificationSchema);
