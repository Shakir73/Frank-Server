"use strict";

const Complain = include("models/complain");
const Q = require("q");

class ComplainsController {
  findAll() {
    return Complain.find().exec();
  }

  findByTransporter(user, contractorId) {
    console.log("=>", contractorId);
    return Complain.findByTransporter(contractorId);
  }

  findByUser(user, contractorId) {
    console.log("=>", contractorId);
    return Complain.findByUser(contractorId);
  }

  findForToday() {
    var date = (new Date() / 1000) * 1000 - 96 * 60 * 60 * 1000;
    return Complain.findAfterTime(date);
  }

  async requestCallBack(user, data) {
    if (!data.number || !data.name) {
      return { status: 422, message: "Paramters missing" };
    }
    try {
      data.type = "callback";
      let complain = new Complain(data);
      await complain.save();
      return { status: 200, data: complain };
    } catch (error) {
      return { status: 400, data: error };
    }
  }

  async contactUs(res, body) {
    return Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "inquiry",
        {
          from: "support@hitechsolution.io",
          to: "salman@hitechsolution.io",
          subject: "Frank Contact Us",
          context: {
            ...body
          }
        },
        function(err) {
          if (err) {
            console.log(err);
            reject({
              status: 401,
              message: "There was an error sending email, please try again"
            });
            return;
          }
          resolve({
            status: 200,
            data: {
              message:
                "We've received your message, our team will contact you shortly"
            }
          });
        }
      );
    });
  }
}

var exports = (module.exports = new ComplainsController());
