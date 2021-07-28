"use strict";

var router = require("express").Router();

var feedbackController = include("controllers/feedback");

router.get("/all", findAll);
function findAll(req, res, next) {
  res.json(feedbackController.findAll(req.user, req.body));
}

router.get("/getbytransporter/:id", findByTransporter);
function findByTransporter(req, res, next) {
  res.json(feedbackController.findByTransporter(req.user, req.params.id));
}

router.get("/getbyuser/:id", findByUser);
function findByUser(req, res, next) {
  res.json(feedbackController.findByUser(req.user, req.params.id));
}

router.get("/today", today);
function today(req, res, next) {
  res.json(feedbackController.findForToday(req.body));
}

module.exports = router;
