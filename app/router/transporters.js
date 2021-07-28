const express = require("express");
const router = express.Router();
const transportersController = include("controllers/transporters");
const { adminGuard } = require('../components/guards');
var UploadServiceComponent = include("components/upload");
var multer = require("multer");
const transporters = require("../controllers/transporters");
var upload = multer({
  dest: "files/",
});

router.post("/login", login);
function login(req, res, next) {
  res.json(transportersController.login(req.body));
}

router.post("/loginmobile", loginMobile);
function loginMobile(req, res, next) {
  res.json(transportersController.loginMobile(req.body));
}

router.post("/signup", signup);
function signup(req, res, next) {
  res.json(transportersController.signup(res, req.body));
}

router.post("/upload", upload.single("file"), uploadImage);
function uploadImage(req, res, next) {
  console.log(req.file);
  res.json(UploadServiceComponent.uploadFile(req.user, req.file));
}

router.post("/verify", verify);
function verify(req, res, next) {
  res.json(transportersController.verify(req.user, req.body));
}

router.post("/verifylogin", verifyLogin);
function verifyLogin(req, res, next) {
  res.json(transportersController.verifyLogin(req.body));
}

router.post("/update", update);
function update(req, res, next) {
  res.json(transportersController.update(req.user, req.body));
}

router.post("/updateadmin", updateAdmin);
function updateAdmin(req, res, next) {
  res.json(transportersController.updateAdmin(req.user, req.body));
}

router.post("/changeemail", changeEmail);
function changeEmail(req, res, next) {
  res.json(transportersController.changeEmail(req.user, req.body));
}

router.post("/resendcode", resendCode);
function resendCode(req, res, next) {
  res.json(transportersController.resendCode(res, req.user, req.body));
}

router.post("/forgotpassword", forgotPassword);
function forgotPassword(req, res, next) {
  console.log(req.body);
  res.json(transportersController.forgotPassword(res, req.body));
}

router.post("/confirmrecovery", verifyCode);
function verifyCode(req, res, next) {
  res.json(transportersController.verifyRecoveryCode(req.body));
}

router.post("/resetpassword", updatePassword);
function updatePassword(req, res, next) {
  res.json(transportersController.updatePassword(req.body));
}

router.post("/changepassword", changePassword);
function changePassword(req, res, next) {
  res.json(transportersController.changePassword(req.user, req.body));
}

router.get("/all-serviceareas", function (req, res, next) {
  res.json(transportersController.allServiceareas(req.user));
});

router.post("/addservicearea", addServiceArea);
function addServiceArea(req, res, next) {
  res.json(transportersController.addServiceArea(req.user, req.body));
}

router.delete("/deleteservicearea/:id", deleteServiceArea);
function deleteServiceArea(req, res, next) {
  res.json(transportersController.deleteServiceArea(req.user, req.params.id));
}

router.post("/addcustomservicearea", addCustomServiceArea);
function addCustomServiceArea(req, res, next) {
  res.json(transportersController.addCustomServiceArea(req.user, req.body));
}

router.get("/serviceareas/:id*?", getServiceAreas);
function getServiceAreas(req, res, next) {
  res.json(transportersController.getServiceAreas(req.user, req.params.id));
}

router.post("/updatedestination", updateDestination);
function updateDestination(req, res, next) {
  res.json(transportersController.updateDestination(req.user, req.body));
}

router.post("/adddestination", addDestination);
function addDestination(req, res, next) {
  res.json(transportersController.addDestination(req.user, req.body));
}

router.delete("/deletejourney", deleteJourney);
function deleteJourney(req, res, next) {
  res.json(transportersController.deleteJourney(req.user, req.body));
}

router.post("/adddriver", addDriver);
function addDriver(req, res, next) {
  res.json(transportersController.addDriver(res, req.user, req.body));
}

router.get("/drivers", getDrivers);
function getDrivers(req, res, next) {
  res.json(transportersController.getDrivers(req.user));
}

router.delete("/driver/:driver", deleteDriver);
function deleteDriver(req, res, next) {
  res.json(transportersController.deleteDriver(req.user, req.params.driver));
}

router.post("/block", blockDriver);
function blockDriver(req, res, next) {
  res.json(transportersController.blockDriver(req.user, req.body));
}

router.post("/ban", banTransporter);
function banTransporter(req, res, next) {
  res.json(transportersController.banTransporter(req.user, req.body));
}

router.post("/activate", activate);
function activate(req, res, next) {
  res.json(transportersController.activate(req.user, req.body));
}

router.post("/nearby", findNearby);
function findNearby(req, res, next) {
  res.json(transportersController.findNearby(req.body));
}

router.post("/specific", findSpecific);
function findSpecific(req, res, next) {
  res.json(transportersController.findSpecific(req.body));
}

router.post("/filter", filter);
function filter(req, res, next) {
  res.json(transportersController.filter(req.user, req.body));
}

router.get("/get/:type?", adminGuard, function (req, res, next) {
  res.json(transportersController.getAll(req.user, req.params.type));
});

router.get("/profile/:id", getById);
function getById(req, res, next) {
  res.json(transportersController.getById(req.params.id));
}

router.get("/customers/:id", getCustomersWorkedWith);
function getCustomersWorkedWith(req, res, next) {
  res.json(
    transportersController.getCustomersWorkedWith(req.user, req.params.id)
  );
}

router.get("/idenfystatus/:id", checkIdenfyStatus);
function checkIdenfyStatus(req, res, next) {
  res.json(transportersController.checkIdenfyStatus(req.user, req.params.id));
}

router.get("/idenfydata/:id", getIdenfyData);
function getIdenfyData(req, res, next) {
  res.json(transportersController.getIdenfyData(req.user, req.params.id));
}

router.delete("/deletevehicle/:id", deleteVehicleById);
function deleteVehicleById(req, res, next) {
  res.json(transportersController.deleteVehicleById(req.user, req.params.id));
}

router.delete("/delete/:id", deleteUser);
function deleteUser(req, res, next) {
  res.json(transportersController.deleteUser(req.user, req.params.id));
}

router.get("/search/:text", search);
function search(req, res, next) {
  res.json(transportersController.search(req.user, req.params.text));
}

router.post("/stats", getStats);
function getStats(req, res, next) {
  res.json(transportersController.getStats(req.user, req.body));
}

router.post("/add-idenfy-scan", function (req, res, next) {
  res.json(transportersController.addIdenfyScanRef(req.user, req.body));
});

router.get("/transporter-record", (req, res, next) => {
  res.json(transportersController.transporterRecord(req.user));
});

module.exports = router;
