const express = require("express");
const router = express.Router();

const { create, getAll, get, update, deleteAll
} = require('../controllers/policies');
const { route } = require("./banks");

router.post('/', function(req, res, next) {
    res.json(create(req.user, req.body));
});

router.get('/', function(req, res, next) {
    res.json(getAll(req.user));
});

router.get('/:id', function(req, res, next) {
    res.json(get(req.user, req.params.id));
});

router.post('/:id', function(req, res, next) {
    res.json(update(req.user, req.body, req.params.id));
});

router.delete('/', function(req, res, next) {
    res.json(deleteAll(req.user));
});


module.exports = router;