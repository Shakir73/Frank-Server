"use strict";
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Support Schema
 */
var Support = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    transporter: {
      type: Schema.Types.ObjectId,
      ref: "Transporter",
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    type: String,
    lastMessage: String,
    group: { type: Boolean, default: false },
    lastMessageTime: Number,
    isMutedByUser: {
      type: Boolean,
      default: false,
    },
    isMutedBySupport: {
      type: Boolean,
      default: false,
    },

    userUnread: {
      type: Number,
      default: 0,
    },
    supportUnread: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

Support.statics.findAll = function () {
  return this.find({
    lastMessage: {
      $ne: undefined,
    },
  })
    .populate("user")
    .populate("transporter")

    .sort({
      lastMessageTime: -1,
    })
    .exec();
};

Support.statics.findById = function (id) {
  return this.findOne({
    _id: mongoose.Types.ObjectId(id),
  })
    .populate("user")
    .populate("transporter")

    .exec();
};

Support.statics.muteChat = function (id, data) {
  return this.findOneAndUpdate(
    {
      _id: mongoose.Types.ObjectId(id),
    },
    {
      $set: data,
    }
  )
    .populate("user1")
    .populate("user2")
    .exec();
};

Support.statics.findByUsers = function (user, transporter) {
  return this.findOne({
    $or: [
      {
        user: user,
        transporter: transporter,
      },
      {
        transporter: user,
        user: transporter,
      },
    ],
  })
    .populate("user")
    .populate("transporter")

    .exec();
};

Support.statics.findByUsersAndJob = function (user, transporter, job) {
  return this.findOne({
    user: user,
    transporter: transporter,
    job: job,
  })
    .populate("user")
    .populate("transporter")

    .exec();
};

Support.statics.findByUser = function (user) {
  console.log(user);
  return this.find({
    $or: [
      {
        user: user,
      },
      {
        transporter: user,
      },
      {
        contractor2: user,
      },
      {
        crew: user,
      },
    ],
    lastMessage: {
      $ne: undefined,
    },
  })
    .populate("user")
    .populate("transporter")

    .sort({
      lastMessageTime: -1,
    })
    .exec();
};

Support.statics.getRecent = function (user) {
  return this.find({
    $or: [
      {
        user: user,
      },
      {
        transporter: user,
      },
      {
        contractor2: user,
      },
      {
        crew: user,
      },
    ],
    // lastMessage: {
    // 	$ne: undefined
    // }
  })
    .populate("user")
    .populate("transporter")

    .limit(5)
    .sort({
      lastMessageTime: -1,
    })
    .exec();
};

Support.statics.countByUser = function (user) {
  console.log(user);
  return this.count({
    $or: [
      {
        user: user,
        userUnread: { $gt: 0 },
      },
      {
        transporter: user,
        contractorUnread: { $gt: 0 },
      },
      {
        contractor2: user,
        contractor2Unread: { $gt: 0 },
      },
      {
        crew: user,
        crewUnread: { $gt: 0 },
      },
    ],
    lastMessage: {
      $ne: undefined,
    },
  }).exec();
};

Support.statics.findByCrew = function (crew, transporter) {
  return this.find({
    $or: [
      {
        crew: crew,
      },
      { transporter: transporter, group: true },
    ],
    // lastMessage: {
    // 	$ne: undefined
    // }
  })
    .populate("user")
    .populate("transporter")

    .sort({
      lastMessageTime: -1,
    })
    .exec();
};

Support.statics.findByUserForSpecificJob = function (user, job) {
  console.log(user);
  return this.find({
    user: user,
    job: job,
  })
    .populate("user")
    .populate("transporter")

    .sort({
      lastMessageTime: -1,
    })
    .exec();
};

Support.statics.findByContractorForSpecificJob = function (user, job) {
  console.log(user);
  return this.find({
    $or: [{ transporter: user }, { crew: user }],
    job: job,
  })
    .populate("user")
    .populate("transporter")

    .sort({
      lastMessageTime: -1,
    })
    .exec();
};

Support.statics.findByParams = function (params) {
  return this.findOne(params)
    .populate("user")
    .populate("transporter")

    .sort({
      lastMessageTime: -1,
    })
    .exec();
};

Support.statics.updateChat = function (id, data) {
  return this.findOneAndUpdate({ _id: id }, { $set: data }).exec();
};

module.exports = mongoose.model("Support", Support);
