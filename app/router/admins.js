const express = require("express");
const router = express.Router();
const adminController = include("controllers/admins");
const { adminGuard } = require("../components/guards");

router.post("/login", login);
function login(req, res, next) {
  res.json(adminController.login(req.body));
}

router.post("/signup", function (req, res, next) {
  res.json(adminController.signup(req.body));
});

router.post("/forgotPassword", function (req, res, next) {
  res.json(adminController.forgotPassword(req.body, res));
});

router.post("/resetPassword/:token", function (req, res, next) {
  res.json(adminController.resetPassword(req.body, req.params.token));
});

router.use(adminGuard);

router.post("/update", function (req, res, next) {
  res.json(adminController.update(req.user, req.body));
});

router.post("/rank", addRank);
function addRank(req, res, next) {
  res.json(adminController.addRank(req.user, req.body));
}

router.get("/dashboard", dashboard);
function dashboard(req, res, next) {
  res.json(adminController.dashboard(req.user));
}

router.get("/currentupdates", function (req, res, next) {
  res.json(adminController.currentUpdates(req.user));
});

router.get("/stats/:start/:end", stats);
function stats(req, res, next) {
  res.json(adminController.stats(req.user, req.params));
}

router.get("/all", getAll);
function getAll(req, res, next) {
  res.json(adminController.getAll(req.user));
}

router.get("/zone", importZones);
function importZones(req, res, next) {
  res.json(adminController.importZones(req.user));
}

module.exports = router;
