const express = require("express");
const router = express.Router();
const commoditiesController = include("controllers/commodities");

router.post("/update", updateById);
function updateById(req, res, next) {
  res.json(commoditiesController.updateById(req.user, req.body));
}

module.exports = router;
