const express = require("express");
const router = express.Router();
const vehiclesController = include("controllers/vehicles");

router.post("/add", addVehicle);
function addVehicle(req, res, next) {
  res.json(vehiclesController.add(req.user, req.body));
}

router.get("/get", getVehicles);
function getVehicles(req, res, next) {
  res.json(vehiclesController.getVehicles(req.user));
}

router.get("/:type?", function(req, res, next){
  res.json(vehiclesController.getVehiclesByTime(req.user, req.params.type));
});

router.get("/getbyid/:id", getById);
function getById(req, res, next) {
  res.json(vehiclesController.getById(req.user, req.params.id));
}

router.get("/all", getAllVehicles);
function getAllVehicles(req, res, next) {
  res.json(vehiclesController.getAllVehicles(req.user));
}

router.post("/activate", activate);
function activate(req, res, next) {
  res.json(vehiclesController.activate(req.user, req.body));
}

router.post("/toggle", toggle);
function toggle(req, res, next) {
  res.json(vehiclesController.toggle(req.user, req.body));
}

router.post("/assigndriver", assignDriver);
function assignDriver(req, res, next) {
  res.json(vehiclesController.assignDriver(req.user, req.body));
}

router.post("/removedriver", removeDriver);
function removeDriver(req, res, next) {
  res.json(vehiclesController.removeDriver(req.user, req.body));
}

router.get("/search/:text", function(req, res, next){
  res.json(vehiclesController.search(req.user, req.params.text));
});

module.exports = router;
