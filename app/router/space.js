const express = require("express");
const router = express.Router();
const spaceController = include("controllers/space");

router.post("/add", add);
function add(req, res, next) {
  res.json(spaceController.add(req.user, req.body));
}

router.post("/update", updateRates);
function updateRates(req, res, next) {
  res.json(spaceController.updateRates(req.user, req.body));
}

router.post("/find", findNearBy);
function findNearBy(req, res, next) {
  res.json(spaceController.findNearBy(req.user, req.body));
}

router.post("/pickupPoints/nearby", findNearByPickupPoints);
function findNearByPickupPoints(req, res, next) {
  res.json(spaceController.findNearByPickupPoints(req.user, req.body));
}

router.get("/all", getAll);
function getAll(req, res, next) {
  res.json(spaceController.getAll(req.user, req.body));
}

router.get("/my", getMySpaces);
function getMySpaces(req, res, next) {
  res.json(spaceController.getMySpaces(req.user));
}

router.delete("/:id", deletetMySpace);
function deletetMySpace(req, res, next) {
  res.json(spaceController.deletetMySpace(req.user, req.params.id));
}

router.get("/:id", getById);
function getById(req, res, next) {
  res.json(spaceController.getById(req.user, req.params.id));
}

module.exports = router;
