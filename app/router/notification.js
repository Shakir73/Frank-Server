"use strict";

var router = require("express").Router();

var notificationController = include("controllers/notifications");

router.post("/send", sendChatNotification);

function sendChatNotification(req, res, next) {
  res.json(notificationController.sendChatNotification(req.user, req.body));
}

router.post("/updateStatus", updateStatus);

function updateStatus(req, res, next) {
  res.json(notificationController.updateStatus(req.user, req.body));
}

router.post("/read", markRead);

function markRead(req, res, next) {
  res.json(notificationController.markRead(req.user, req.body));
}

router.get("/received", getReceivedNotifications);

function getReceivedNotifications(req, res, next) {
  res.json(notificationController.getReceivedNotifications(req.user));
}

router.get("/transporter/:id", getReceivedNotificationsByContractor);

function getReceivedNotificationsByContractor(req, res, next) {
  res.json(
    notificationController.getReceivedNotificationsByContractor(
      req.user,
      req.params.id
    )
  );
}

router.get("/getbyuser/:userId", getReceivedNotificationsByUser);

function getReceivedNotificationsByUser(req, res, next) {
  res.json(
    notificationController.getReceivedNotificationsByUser(
      req.user,
      req.params.userId
    )
  );
}

router.get("/getcount", getReceivedNotificationsCount);

function getReceivedNotificationsCount(req, res, next) {
  res.json(notificationController.getReceivedNotificationsCount(req.user));
}

module.exports = router;
