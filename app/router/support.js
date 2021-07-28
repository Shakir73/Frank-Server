"use strict";

var router = require("express").Router();

var supportController = include("controllers/support");
// const ImageServiceComponent = include("components/upload");

var multer = require("multer");
var upload = multer({
  dest: "files/",
});

router.post("/initiate", add);

function add(req, res, next) {
  res.json(supportController.add(req.user, req.body));
}

router.post("/mute", mute);

function mute(req, res, next) {
  res.json(supportController.mute(req.user, req.body));
}

router.post("/sendmessage", sendMessage);

function sendMessage(req, res, next) {
  res.json(supportController.sendMessage(req.user, req.body));
}

router.post("/update", update);

function update(req, res, next) {
  res.json(supportController.update(req.user, req.body));
}

router.post("/delete/:chatId", deleteById);

function deleteById(req, res, next) {
  res.json(supportController.deleteById(req.user, req.params.staffId));
}

router.get("/getall/:type*?", findByUser);

function findByUser(req, res, next) {
  res.json(supportController.findByUser(req.user, req.params.type));
}

router.get("/all/:type*?", findAll);

function findAll(req, res, next) {
  res.json(supportController.findAll(req.user, req.params.type));
}

router.get("/findbyuser/:userId", findForSpecificUser);

function findForSpecificUser(req, res, next) {
  res.json(supportController.findForSpecificUser(req.params.userId));
}

router.get("/findbyjobuser/:jobId", findByUserForSpecificJob);

function findByUserForSpecificJob(req, res, next) {
  res.json(
    supportController.findByUserForSpecificJob(req.user, req.params.jobId)
  );
}

router.get("/findbyjobcontractor/:jobId", findByContractorForSpecificJob);

function findByContractorForSpecificJob(req, res, next) {
  res.json(
    supportController.findByContractorForSpecificJob(req.user, req.params.jobId)
  );
}

module.exports = router;
