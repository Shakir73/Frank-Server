const express = require("express");
const router = express.Router();
const bankController = include("controllers/banks");

router.post("/add", addAccount);
function addAccount(req, res, next) {
  res.json(bankController.add(req.user, req.body));
}

router.post("/default", changeActiveStatus);
function changeActiveStatus(req, res, next) {
  res.json(bankController.changeActiveStatus(req.user, req.body));
}

router.get("/get", getByUser);
function getByUser(req, res, next) {
  res.json(bankController.getByUser(req.user));
}

router.get('/', function(req, res, next){
  res.json(bankController.getAll());
});

router.get('/:id', function(req, res, next){
  res.json(bankController.getAccount(req.user, req.params.id));
});

router.delete('/:id', function(req, res, next){
  res.json(bankController.deleteAccount(req.params.id));
});

router.post('/update/:id', function(req, res, next){
  res.json(bankController.updateAccount(req.params.id, req.body, req.user));
});

module.exports = router;
