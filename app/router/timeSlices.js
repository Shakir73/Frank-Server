const express = require("express");
const router = express.Router();

const {
  addSlice,
  getSlice,
  byTransporter,
  // getById,
  deleteByTransporter,
  pwaTimeSlot,
  showTimeslots
} = require("../controllers/timeSlices");

router.get("/get-by-transporter/:transporter?", byTransporter);
router.get("/pwa-time-slot/:order_id", pwaTimeSlot);
router.get("/show-time-slots/:transporter", showTimeslots);

router.route("/").get(getSlice).post(addSlice);
router.route('/:id').delete(deleteByTransporter)

module.exports = router;
