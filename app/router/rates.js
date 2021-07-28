const express = require("express");
const router = express.Router();
const ratesController = include("controllers/rates");

router.post("/add", add);
function add(req, res, next) {
  res.json(ratesController.add(req.user, req.body));
}

router.post("/update", updateRates);
function updateRates(req, res, next) {
  res.json(ratesController.updateRates(req.user, req.body));
}

router.get("/all", getAll);
function getAll(req, res, next) {
  res.json(ratesController.getAll(req.user, req.body));
}

module.exports = router;
