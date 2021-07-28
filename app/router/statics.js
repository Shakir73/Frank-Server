const express = require("express");
const router = express.Router();
const staticController = include("controllers/statics");

router.post("/addFAQ", addFAQ);
function addFAQ(req, res, next) {
  res.json(staticController.addFAQ(req.user, req.body));
}

router.post("/addBusiness", addBusinessSector);
function addBusinessSector(req, res, next) {
  res.json(staticController.addBusinessSector(req.user, req.body));
}

router.get("/get", getAll);
function getAll(req, res, next) {
  res.json(staticController.getAll(req.user));
}

module.exports = router;
