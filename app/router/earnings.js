const express = require("express");
const router = express.Router();

const {
  getAllEarnings,
  getAll,
  updateByTransporter,
  addEarning,
  updateById,
  deleteEarningByTransporter,
  deleteEarningById,
  search,
} = require("../controllers/earnings");

router.get("/get-all", getAllEarnings);
router.post("/update-by-transporter", updateByTransporter);
// router.get("/get-by-transporter/:id", getByTransporter);
router.delete("/delete-by-transporter/:id", deleteEarningByTransporter);
router.post("/search", search);

router.get("/:transporter?", getAll)
router.post('/', addEarning);

router.route("/:id").post(updateById).delete(deleteEarningById);
module.exports = router;
