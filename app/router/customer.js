"use strict";

var router = require("express").Router();

var customerController = include("controllers/customer");

router.post("/add", add);
function add(req, res, next) {
  console.log(req.body);
  res.json(customerController.addCustomerCard(req.user, req.body));
}

/* Get profile for any users */
router.get("/get", getCards);
function getCards(req, res, next) {
  res.json(customerController.getCard(req.user));
}
router.post("/charge", charge);
function charge(req, res, next) {
  res.json(customerController.charge(req.user, req.body));
}

router.post("/updatedefault", updateDefault);
function updateDefault(req, res, next) {
  res.json(customerController.updateDefault(req.user, req.body));
}

router.delete("/delete", deleteCard);
function deleteCard(req, res, next) {
  res.json(customerController.deleteCard(req.user, req.body));
}

module.exports = router;
