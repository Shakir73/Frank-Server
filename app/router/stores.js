const express = require("express");
const router = express.Router();
const storesController = include("controllers/stores");
const { adminGuard, storeGuard } = require('../components/guards');
var UploadServiceComponent = include("components/upload");
var request = require('request');

var multer = require("multer");
var upload = multer({
  dest: "files/",
});

// router.post("/login", login);
// function login(req, res, next) {
//   res.json(storesController.login(req.body));
// }

router.post("/signup", signup);
function signup(req, res, next) {
  res.json(storesController.signup(res, req.body));
}

router.post("/verify", verify);
function verify(req, res, next) {
  res.json(storesController.verify(req.user, req.body));
}

router.post("/login", loginMobile);
function loginMobile(req, res, next) {
  res.json(storesController.login(req.body));
}

router.post("/verifylogin", verifyLogin);
function verifyLogin(req, res, next) {
  res.json(storesController.verifyLogin(req.body));
}

router.post("/update", update);
function update(req, res, next) {
  res.json(storesController.update(req.user, req.body));
}

router.post("/activate", adminGuard, activate);
function activate(req, res, next) {
  res.json(storesController.activate(res, req.user, req.body));
}

router.post("/updateContactDetails", updateContactDetails);
function updateContactDetails(req, res, next) {
  res.json(storesController.updateContactDetails(req.user, req.body));
}

router.post("/addEmail", storeGuard, addEmailAddress);
function addEmailAddress(req, res, next) {
  res.json(storesController.addEmailAddress(req.user, req.body));
}

router.get("/get-all-store-users", (req, res, next) => {
  res.json(storesController.getAllStoreUsers(req.user));
});

router.post("/changeemail", changeEmail);
function changeEmail(req, res, next) {
  res.json(storesController.changeEmail(req.user, req.body));
}

router.post("/resendcode", resendCode);
function resendCode(req, res, next) {
  res.json(storesController.resendCode(res, req.user, req.body));
}

router.post("/forgotpassword", forgotPassword);
function forgotPassword(req, res, next) {
  console.log(req.body);
  res.json(storesController.forgotPassword(res, req.body));
}

router.post("/confirmrecovery", verifyCode);
function verifyCode(req, res, next) {
  res.json(storesController.verifyRecoveryCode(req.body));
}

router.post("/resetpassword", updatePassword);
function updatePassword(req, res, next) {
  res.json(storesController.updatePassword(req.body));
}

router.post("/changepassword", changePassword);
function changePassword(req, res, next) {
  res.json(storesController.changePassword(req.user, req.body));
}

router.post("/resendVerification", resendVerification);
function resendVerification(req, res, next) {
  res.json(storesController.resendVerification(req.user, req.body));
}

router.post("/upload", upload.single("file"), uploadImage);
function uploadImage(req, res, next) {
  res.json(UploadServiceComponent.uploadFile(req.user, req.file));
}

router.post("/multiupload", upload.array("files", 10), uploadMultipleImages);
function uploadMultipleImages(req, res, next) {
  console.log(req.files);
  res.json(UploadServiceComponent.uploadMultipleImages(req.user, req.files));
}

router.post("/ban", adminGuard, banUser);
function banUser(req, res, next) {
  res.json(storesController.banUser(req.user, req.body));
}

router.post("/stats", getStats);
function getStats(req, res, next) {
  res.json(storesController.getStats(req.user, req.body));
}

router.post("/filter", filter);
function filter(req, res, next) {
  res.json(storesController.filter(req.user, req.body));
}

router.post("/addWarehouse", addWarehouse);
function addWarehouse(req, res, next) {
  res.json(storesController.addWarehouse(req.user, req.body));
}

router.get("/warehouse", getMyWarehouses);
function getMyWarehouses(req, res, next) {
  res.json(storesController.getMyWarehouses(req.user));
}

router.get('/warehouse/:id', function(req, res, next){
  res.json(storesController.getMyWarehouseById(req.user, req.params.id));
});

router.delete("/warehouse/:id", deleteWarehouse);
function deleteWarehouse(req, res, next) {
  res.json(storesController.deleteWarehouse(req.user, req.params.id));
}

router.post("/warehouse/:id", function(req, res, next){
  res.json(storesController.updateWarehouse(req.user, req.params.id, req.body));
});

router.get("/recentorders", getRecentOrders);
function getRecentOrders(req, res, next) {
  res.json(storesController.getRecentOrders(req.user));
}

router.get("/get", adminGuard, getAll);
function getAll(req, res, next) {
  res.json(storesController.getAll(req.user));
}

router.get("/get/:uniqueID", getStoreByUniqueID);
function getStoreByUniqueID(req, res, next) {
  res.json(storesController.getStoreByUniqueID(req.params.uniqueID));
}

router.get("/myprofile/:id", storeGuard, getMyProfile);
function getMyProfile(req, res, next) {
  res.json(storesController.getMyProfile(req.params.id));
}

router.delete("/delete/:id", adminGuard, function(req, res, next){
  res.json(storesController.deleteStore(req.params.id));
});

router.delete("/deleteAccount", storeGuard, deleteAccount);
function deleteAccount(req, res, next) {
  res.json(storesController.deleteAccount(req.user));
}

router.get("/mytransporters", getMyTransporters);
function getMyTransporters(req, res, next) {
  res.json(storesController.getMyTransporters(req.user));
}

router.get("/search/:text", search);
function search(req, res, next) {
  res.json(storesController.search(req.user, req.params.text));
}

router.get('/isActive/:id', function(req, res, next) {
  res.json(storesController.isActive(req.user, req.params.id));
});

router.post('/add-products-from-prestashop/:id', function(req, res, next) {
  res.json(storesController.addFromPrestashop(req.user, req.params.id));
});

router.get('/get-all-products-from-prestashop/:id', function(req, res, next) {
  res.json(storesController.getPrestashopProducts(req.user, req.params.id));
});

router.get('/store-statics/:id', function(req, res, next) {
  res.json(storesController.storeStatics(req.user, req.params.id));
});

router.get('/store-order-status/:id', function(req, res, next) {
  res.json(storesController.ordersByStatus(req.user, req.params.id));
});

router.post('/de-active', adminGuard, function(req, res, next) {
  res.json(storesController.deActive(res, req.user, req.body));
});

module.exports = router;
