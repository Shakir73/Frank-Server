"use strict";

var router = require("express").Router();

var promoController = include("controllers/promo");

router.post("/apply", applyPromo);
function applyPromo(req, res, next) {
  res.json(promoController.applyPromo(req.user, req.body));
}

router.post("/add", addPromo);
function addPromo(req, res, next) {
  res.json(promoController.addPromo(req.body));
}

router.post("/expire", expirePromo);
function expirePromo(req, res, next) {
  res.json(promoController.expirePromo(req.user, req.body));
}

router.post("/update", updateExpiryDate);
function updateExpiryDate(req, res, next) {
  res.json(promoController.updateExpiryDate(req.user, req.body));
}

router.get("/all", getAll);
function getAll(req, res, next) {
  res.json(promoController.getAll(req.user));
}

router.get("/active", getActivePromotions);
function getActivePromotions(req, res, next) {
  res.json(promoController.getActivePromotions(req.user));
}

module.exports = router;
