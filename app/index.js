global.include = function(name) {
  return require(__dirname + "/" + name);
};
var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var fs = require("fs");
var jade = require("jade");
var logger = require("morgan");

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));

app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "5mb" }));

app.use(express.static(path.join(__dirname, "../public")));
app.use(require("express-promise")());

var mailer = require("nodemailer");
app.use((req, res, next) => {
  const transport = mailer.createTransport({
    // from: "Suppport",
    host: "mail.hitechsolution.io",
    secure: true,
    port: 465,
    transportMethod: "SMTP",
    auth: {
      user: "support@hitechsolution.io",
      pass: "5GX-qR8cNe"
    }
  });

  res.mailer = {
    send(templateName, options, callback) {
      var template = process.cwd() + "/app/views/" + templateName + ".jade";

      console.log({ template });

      fs.readFile(template, "utf8", function(err, file) {
        if (err) {
          console.log("Error", err);
        } else {
          var compiledTmpl = jade.compile(file, { filename: template });
          options.html = compiledTmpl(options.context);

          transport
            .sendMail(options)
            .then(function(response) {
              console.log("success =>", response);
              callback(null, response);
            })
            .catch(function(response) {
              console.log("error =>", response);
              callback(response);
            });
        }
      });
    }
  };

  next();
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  next();
});

function setupRoutes() {
  const routes = require("./routes");
  routes.setup(app);
  const backendRoutes = ["/users"];
  const frontendRoutes = [];
  // app.use(function(req, res, next) {
  // 	res.status(200);
  // 	res.sendFile("index.html", { root: path.join(__dirname, "../public") });
  // });
  app.use(function(err, req, res, next) {
    res.status(err.headerStatus || err.status || 403);
    res.send({
      status: err.status || 403,
      message: err.message || err,
      data: err.data || {}
    });
  });
}
setupRoutes();
require('./server').connection(app);
