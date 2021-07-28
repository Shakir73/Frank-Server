const express = require("express");
const router = express.Router();
const logsController = include("controllers/modificationlogs");

router.get("/get/:id", getById);
function getById(req, res, next) {
  res.json(logsController.getById(req.user, req.params.id));
}

router.post("/accept", acceptModificationRequest);
function acceptModificationRequest(req, res, next) {
  res.json(logsController.acceptModificationRequest(req.user, req.body));
}

module.exports = router;
