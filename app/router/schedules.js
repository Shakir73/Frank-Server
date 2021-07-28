const express = require("express");
const router = express.Router();
const scheduleController = include("controllers/schedules");

router.post("/set", add);
function add(req, res, next) {
  res.json(scheduleController.add(req.user, req.body));
}

router.post("/update", updateRates);
function updateRates(req, res, next) {
  res.json(scheduleController.updateRates(req.user, req.body));
}

router.get("/all", getAll);
function getAll(req, res, next) {
  res.json(scheduleController.getAll(req.user, req.body));
}

router.get("/my", getMySchedules);
function getMySchedules(req, res, next) {
  res.json(scheduleController.getMySchedule(req.user));
}

router.delete("/:id", deletetMySchedule);
function deletetMySchedule(req, res, next) {
  res.json(scheduleController.deletetMySchedule(req.user, req.params.id));
}

router.get("/:id", getById);
function getById(req, res, next) {
  res.json(scheduleController.getById(req.user, req.params.id));
}

module.exports = router;
