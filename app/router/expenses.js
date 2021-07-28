"use strict";

var router = require("express").Router();

var expensesController = include("controllers/expenses");

router.get("/all", findAll);
function findAll(req, res, next) {
  res.json(expensesController.findAll(req.user, req.body));
}

router.get("/getbytransporter/:id", findByTransporter);
function findByTransporter(req, res, next) {
  res.json(expensesController.findByTransporter(req.user, req.params.id));
}

router.get("/order/:id", findByOrder);
function findByOrder(req, res, next) {
  res.json(expensesController.findByOrder(req.user, req.params.id));
}

router.get("/getbyuser/:id", findByUser);
function findByUser(req, res, next) {
  res.json(expensesController.findByUser(req.user, req.params.id));
}

router.get("/today", today);
function today(req, res, next) {
  res.json(expensesController.findForToday(req.body));
}

router.post("/add", add);
function add(req, res, next) {
  res.json(expensesController.add(req.user, req.body));
}

module.exports = router;
