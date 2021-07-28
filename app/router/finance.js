const express = require("express");
const router = express.Router();
const financeController = include("controllers/finance");

router.get("/all", getAll);
function getAll(req, res, next) {
  res.json(financeController.getAll(req.user, req.body));
}

router.get("/get-status", function (req, res, next) {
  res.json(financeController.getTransporterStatus(req.user));
});
router.get("/detail/:id", getById);
function getById(req, res, next) {
  res.json(financeController.getById(req.user, req.params.id));
}

router.get(
  "/bytransporter/:transporter/:status",
  function (req, res, next) {
    res.json(
      financeController.getByTransporter(
        req.user,
        req.params.transporter,
        req.params.status
      )
    );
  }
);

router.post("/transporterearningbydate/:id", function (req, res, next) {
  res.json(
    financeController.transporterEarningByDate(
      req.user,
      req.params.id,
      req.body
    )
  );
});

router.post("/transporterearningbymonth/:id", function (req, res, next) {
  res.json(
    financeController.transporterEarningByMonth(
      req.user,
      req.params.id,
      req.body
    )
  );
});

router.post("/report/:id", getReport);
function getReport(req, res, next) {
  res.json(financeController.getReport(req.user, req.params.id, req.body));
}

router.post("/add", (req, res, next) => {
  res.json(financeController.add(req.user, req.body));
});

router.post("/pay", pay);
function pay(req, res, next) {
  res.json(financeController.pay(req.user, req.body));
}

router.post("/transporters-details", function (req, res, next) {
  res.json(financeController.transportersDetails(req.user, req.body));
});

module.exports = router;
