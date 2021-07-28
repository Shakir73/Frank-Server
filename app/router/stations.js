"use strict";

var router = require("express").Router();

var stationsController = include("controllers/stations");

router.get("/all", findAll);
function findAll(req, res, next) {
  res.json(stationsController.findAll(req.user, req.body));
}

router.get("/search/:text", searchStation);
function searchStation(req, res, next) {
  res.json(stationsController.searchStation(req.user, req.params.text));
}

router.post("/search", searchStationByLocation);
function searchStationByLocation(req, res, next) {
  res.json(stationsController.searchStationByLocation(req.user, req.body));
}

router.post("/add", add);
function add(req, res, next) {
  res.json(stationsController.add(req.user, req.body));
}

module.exports = router;
