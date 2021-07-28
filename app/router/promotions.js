const express = require("express");
const router = express.Router();

const {
  add,
  getAll,
  updateExpiryDate,
  deleteOne,
} = require("../controllers/promotions");

router.route("/").get(getAll).post(add);
router.post("/update", updateExpiryDate);
router.delete("/delete/:id", deleteOne);

module.exports = router;
