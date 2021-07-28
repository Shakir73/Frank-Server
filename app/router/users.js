const express = require("express");
const router = express.Router();
const usersController = include("controllers/users");
const { adminGuard } = require('../components/guards');
var UploadServiceComponent = include("components/upload");

var multer = require("multer");
var upload = multer({
  dest: "files/",
});

router.post("/login", login);
function login(req, res, next) {
  res.json(usersController.login(req.body));
}

router.post("/signup", signup);
function signup(req, res, next) {
  res.json(usersController.signup(res, req.body));
}

router.post("/verify", verify);
function verify(req, res, next) {
  res.json(usersController.verify(req.user, req.body));
}

router.post("/loginmobile", loginMobile);
function loginMobile(req, res, next) {
  res.json(usersController.loginMobile(req.body));
}

router.post("/verifylogin", verifyLogin);
function verifyLogin(req, res, next) {
  res.json(usersController.verifyLogin(req.body));
}

router.post("/update", update);
function update(req, res, next) {
  res.json(usersController.update(req.user, req.body));
}

router.post("/authenticateWithToken", authenticateWithToken);
function authenticateWithToken(req, res, next) {
  res.json(usersController.authenticateWithToken(req.body));
}

router.post("/changeemail", changeEmail);
function changeEmail(req, res, next) {
  res.json(usersController.changeEmail(req.user, req.body));
}

router.post("/resendcode", resendCode);
function resendCode(req, res, next) {
  res.json(usersController.resendCode(res, req.user, req.body));
}

router.post("/forgotpassword", forgotPassword);
function forgotPassword(req, res, next) {
  console.log(req.body);
  res.json(usersController.forgotPassword(res, req.body));
}

router.post("/confirmrecovery", verifyCode);
function verifyCode(req, res, next) {
  res.json(usersController.verifyRecoveryCode(req.body));
}

router.post("/resetpassword", updatePassword);
function updatePassword(req, res, next) {
  res.json(usersController.updatePassword(req.body));
}

router.post("/changepassword", changePassword);
function changePassword(req, res, next) {
  res.json(usersController.changePassword(req.user, req.body));
}

router.post("/upload", upload.single("file"), uploadImage);
function uploadImage(req, res, next) {
  console.log(req.file, req);
  res.json(UploadServiceComponent.uploadFile(req.user, req.file));
}

router.post("/multiupload", upload.array("files", 10), uploadMultipleImages);
function uploadMultipleImages(req, res, next) {
  console.log(req.files);
  res.json(UploadServiceComponent.uploadMultipleImages(req.user, req.files));
}

router.post("/ban", banUser);
function banUser(req, res, next) {
  res.json(usersController.banUser(req.user, req.body));
}

router.post("/stats", getStats);
function getStats(req, res, next) {
  res.json(usersController.getStats(req.user, req.body));
}

router.post("/filter", filter);
function filter(req, res, next) {
  res.json(usersController.filter(req.user, req.body));
}

router.get("/recentorders", getRecentOrders);
function getRecentOrders(req, res, next) {
  res.json(usersController.getRecentOrders(req.user));
}

router.get("/get", adminGuard, getAll);
function getAll(req, res, next) {
  res.json(usersController.getAll(req.user));
}

router.get("/profile/:id", getUserProfile);
function getUserProfile(req, res, next) {
  res.json(usersController.getUserProfile(req.params.id));
}

router.get("/myprofile/:id", getMyProfile);
function getMyProfile(req, res, next) {
  res.json(usersController.getMyProfile(req.params.id));
}

router.delete("/delete/:id", deleteUser);
function deleteUser(req, res, next) {
  res.json(usersController.deleteUser(req.params.id));
}

router.get("/mytransporters", getMyTransporters);
function getMyTransporters(req, res, next) {
  res.json(usersController.getMyTransporters(req.user));
}

router.get("/search/:text", search);
function search(req, res, next) {
  res.json(usersController.search(req.user, req.params.text));
}

router.get("/customers/:storeId?", getUserByStore);
function getUserByStore(req, res, next) {
  res.json(usersController.getUserByStore(req.user, req.params.storeId));
}

router.get('/customers/:type', function(req, res, next){
  res.json(usersController.getUserByType(req.user, req.params.type));
});

router.get('/customers/:storeId', function(req, res, next) {
  res.json(usersController.getCustomersByStore(req.user, req.params.storeId));
});

module.exports = router;
