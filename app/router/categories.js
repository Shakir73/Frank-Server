"use strict";

var router = require("express").Router();

var categoriesController = include("controllers/categories");

router.post("/add", create);
function create(req, res, next) {
  res.json(categoriesController.create(req.body));
}

router.post("/update", update);
function update(req, res, next) {
  res.json(categoriesController.update(req.user, req.body));
}

router.get("/get", getServices);
function getServices(req, res, next) {
  res.json(categoriesController.getServices(req.user));
}

router.get("/admin", getServices);
function getServices(req, res, next) {
  res.json(categoriesController.getServices(req.user));
}

router.get("/import", importCategories);
function importCategories(req, res, next) {
  res.json(categoriesController.temp());
}

router.get("/getbyid/:id", getById);
function getById(req, res, next) {
  res.json(categoriesController.getById(req.params.id));
}

router.get("/getbyparent/:id", getByParent);
function getByParent(req, res, next) {
  res.json(categoriesController.getByParent(req.params.id));
}

router.get("/search/:text", search);
function search(req, res, next) {
  res.json(categoriesController.search(req.params.text));
}

module.exports = router;
