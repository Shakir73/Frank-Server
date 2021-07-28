"use strict";

var mongoose = require("mongoose");
const _ = require("lodash");
const Notification = include("models/notification");
const User = include("models/user");
const Transporter = include("models/transporter");
var FCM = require("fcm-push");

class NotificationController {
  sendPushToDevice(token, title, message, payload, platform) {
    if (!token) return;
    var serverKey = process.env.FCM_KEY;
    var fcm = new FCM(serverKey);
    var temp = payload;
    var messageObject = {
      to: token, // required
      priority: "High",
      notification: {
        title: title,
        body: message,
        sound: "default",
      },
      data: payload,
    };
    if (platform == "android") {
      var data = payload;
      data.title = title;
      data.body = message;
      data.sound = "default";
      messageObject = {
        to: token, // required
        priority: "High",
        data: payload,
        notification: {
          title: title,
          body: message,
          sound: "default",
        },
      };
    }
    console.log(messageObject);
    fcm.send(messageObject, function (err, response) {
      if (err) {
        console.log("Something has gone wrong!");
      } else {
        console.log("Successfully sent with response: ", response);
      }
    });

    return true;
  }

  async sendRescheduleRequestToUser(data) {
    console.log("params:", data);
    const targetUser = data.user
      ? await User.findById(data.user)
      : await Transporter.findById(data.transporter);
    let notification = new Notification(data);
    notification = await notification.save();

    this.sendPushToDevice(
      targetUser.deviceToken,
      "New alert from P Post",
      notification.message,
      {
        notificationId: notification._id,
        order: data.order,
        type: data.type,
        modificationLog: data.modificationLog,
      },
      targetUser.platform
    );
    return Notification.findById(notification._id);
  }

  async sendNotificationToUser(data) {
    console.log("params:", data);
    const targetUser = await User.findById(data.user);
    if (!targetUser) {
      return {};
    }
    let notification = new Notification(data);
    notification = await notification.save();

    this.sendPushToDevice(
      targetUser.deviceToken,
      "New alert from P Post",
      notification.message,
      {
        notificationId: notification._id,
        order: data.order,
        type: "order",
      },
      targetUser.platform
    );
    return Notification.findById(notification._id);
  }

  async sendNotificationToTransporter(data) {
    console.log("params:", data);
    const targetUser = await Transporter.findById(data.transporter);
    if (!targetUser) {
      return {};
    }
    let notification = new Notification(data);
    notification = await notification.save();

    this.sendPushToDevice(
      targetUser.deviceToken,
      "New alert from P Post",
      notification.message,
      {
        notificationId: notification._id,
        order: data.order,
        type: "order",
      },
      targetUser.platform
    );
    return Notification.findById(notification._id);
  }

  async sendChatNotification(user, data) {
    console.log("params:", data);
    const targetUser = data.user
      ? await User.findById(data.user)
      : await Transporter.findById(data.transporter);

    this.sendPushToDevice(
      targetUser.deviceToken,
      "New chat message",
      data.message,
      {
        order: data.order,
        message: data.message,
        type: "chat",
      },
      targetUser.platform
    );
    return { status: 200, data: {} };
  }

  updateStatus(user, data) {
    return Notification.updateStatus(data._id, data);
  }

  async getReceivedNotifications(user) {
    // console.log(user);
    const data = await Notification.findByReceiverId(user._id);
    // console.log(data);
    return { status: 200, data: data };
  }

  async getReceivedNotificationsCount(user) {
    // console.log(user);
    const count = await Notification.countByReceiverId(user._id);
    console.log(count);
    return { status: 200, data: { count } };
  }

  getReceivedNotificationsByUser(user, userId) {
    return Notification.findByUserId(userId);
  }

  getReceivedNotificationsByUserAndJob(user, userId, job) {
    return Notification.findByUserIdAndJob(userId, job);
  }

  async getReceivedNotificationsByContractor(user, contractorId) {
    console.log(user);
    return Notification.findByContractorId(contractorId);
  }

  async getReceivedNotificationsByContractorAndJob(user, contractorId, job) {
    console.log(user);
    return Notification.findByContractorIdAndJob(contractorId, job);
  }

  async markRead(user, data) {
    const response = await Notification.markRead(data._id, data.flag);
    return { status: 200, data: response };
  }
}

var exports = (module.exports = new NotificationController());
