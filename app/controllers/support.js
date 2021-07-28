"use strict";

var request = require("request");

const Q = require("q");

// Models
const Support = include("models/support");
const User = include("models/user");
var notificationsController = include("controllers/notifications");

class SupportController {
  constructor() {}

  async findAll(user, type) {
    let data = await Support.findAll();
    return { status: 200, data };
  }

  async findByUser(user, type) {
    console.log(user);
    if (type === "crew") {
      const crew = await Crew.findById(user._id);
      const chats = await Support.findByCrew(user._id, crew.transporter._id);
      return chats;
    }
    let data = await Support.findByUser(user._id);
    return { status: 200, data };
  }

  findForSpecificUser(user) {
    return Support.findByUsers(user._id);
  }

  async findByUserForSpecificJob(user, jobId) {
    return Support.findByUserForSpecificJob(user._id, jobId);
  }

  async findByContractorForSpecificJob(user, jobId) {
    return Support.findByContractorForSpecificJob(user._id, jobId);
  }

  deleteById(user, id) {
    var self = this;
    return Support.deleteById(id).then(function (response) {
      return self.findByUser(user._id);
    });
  }

  async add(user, data) {
    if (!data.user && !data.transporter) {
      return Promise.reject("Required data missing");
    }
    console.log(data);
    let chatObject = undefined;

    if (data.transporter) {
      const transporter = data.transporter;

      chatObject = await Support.findByParams({
        transporter,
      });
    } else if (data.user) {
      const user = data.user;
      chatObject = await Support.findByParams({
        user,
      });
    } else if (data.order) {
      const user = data.order;
      chatObject = await Support.findByParams({
        order,
      });
    }

    if (chatObject) {
      return { status: 200, data: chatObject };
    }
    var chat = new Support(data);
    // chat.user = data.user;
    // chat.transporter = data.transporter;
    let response = await chat.save();
    let supportObject = await Support.findById(response._id);
    return { status: 200, data: supportObject };
  }

  async update(user, data) {
    // var chat = await Support.findById(data._id);
    await Support.updateSupport(data._id, data);
    // var chatObj = await chat.save();
    let supportObject = await Support.findById(data._id);
    return { status: 200, data: supportObject };
  }

  async mute(user, data) {
    var chat = await Support.findById(data._id);
    var obj = {};
    if (user._id == chat.user1._id)
      obj = {
        isMutedByUser1: !chat.isMutedByUser1,
      };
    if (user._id == chat.user2._id)
      obj = {
        isMutedByUser2: !chat.isMutedByUser2,
      };
    await Support.muteSupport(data._id, obj);
    return Support.findById(data._id);
  }

  async sendMessage(user, data) {
    console.log(data);
    const chat = await Support.findById(data.chat);
    let receiver;

    if (data.userIndex == "admin") {
      chat.userUnread = chat.userUnread + 1;
      receiver = chat.user;
    } else {
      chat.supportUnread = chat.supportUnread + 1;
    }
    if (receiver) {
      notificationsController.sendPushToDevice(
        receiver.deviceToken,
        "New message from Customer Support",
        data.message,
        {
          chatId: chat._id,
          type: "chat",
          message: data.message,
        },
        receiver.platform
      );
    }

    chat.lastMessage = data.message;
    chat.lastMessageTime = (new Date() * 1000) / 1000;

    await chat.save();
    let supportObject = await Support.findById(data.chat);
    return { status: 200, data: supportObject };
  }
}

var exports = (module.exports = new SupportController());
