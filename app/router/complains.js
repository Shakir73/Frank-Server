"use strict";

var router = require("express").Router();

var complainsController = include("controllers/complains");

router.get("/all", findAll);
function findAll(req, res, next) {
  res.json(complainsController.findAll(req.user, req.body));
}

router.get("/getbytransporter/:id", findByTransporter);
function findByTransporter(req, res, next) {
  res.json(complainsController.findByTransporter(req.user, req.params.id));
}

router.get("/getbyuser/:id", findByUser);
function findByUser(req, res, next) {
  res.json(complainsController.findByUser(req.user, req.params.id));
}

router.get("/today", today);
function today(req, res, next) {
  res.json(complainsController.findForToday(req.body));
}

router.post("/contactus", contactUs);
function contactUs(req, res, next) {
  res.json(complainsController.contactUs(res, req.body));
}

router.post("/callback", requestCallBack);
function requestCallBack(req, res, next) {
  res.json(complainsController.requestCallBack(res, req.body));
}

module.exports = router;
