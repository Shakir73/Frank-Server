const express = require("express");
const router = express.Router();
const carController = include("controllers/cars");

router.post("/add", addAccount);
function addAccount(req, res, next) {
  res.json(carController.add(req.user, req.body));
}

router.get("/get", getAll);
function getAll(req, res, next) {
  res.json(carController.getAll(req.user));
}

module.exports = router;
