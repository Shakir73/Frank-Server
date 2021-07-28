var express = require("express");
var router = express.Router();

router.get("/", root);
function root(req, res, next) {
	res.render("index", { title: "People's Post" });
}
