const express = require("express");
const router = express.Router();
const timeslotsController = include("controllers/timeslots");

router.get("/all", getAll);
function getAll(req, res, next) {
  res.json(timeslotsController.getAll(req.user, req.body));
}

router.post("/find", findBetweenDates);
function findBetweenDates(req, res, next) {
  res.json(timeslotsController.findBetweenDates(req.user, req.body));
}

router.get("/detail/:id", getById);
function getById(req, res, next) {
  res.json(timeslotsController.getById(req.user, req.params.id));
}

router.get("/my/:id", getByTransporter);
function getByTransporter(req, res, next) {
  res.json(timeslotsController.getByTransporter(req.user, req.params.id));
}

router.delete("/:id", deleteById);
function deleteById(req, res, next) {
  res.json(timeslotsController.deleteById(req.user, req.params.id));
}

router.post("/add", add);
function add(req, res, next) {
  res.json(timeslotsController.add(req.user, req.body));
}

router.post("/pay", pay);
function pay(req, res, next) {
  res.json(timeslotsController.pay(req.user, req.body));
}

router.post('/add-timeslote', function(req, res, next) {
  res.json(timeslotsController.addTimeSlote(req.user, req.body));
});

module.exports = router;
