"use strict";

const Feedback = include("models/feedback");

class FeedbackController {
  findAll() {
    return Feedback.find().exec();
  }

  findByTransporter(user, contractorId) {
    console.log("=>", contractorId);
    return Feedback.findByTransporter(contractorId);
  }

  findByUser(user, contractorId) {
    console.log("=>", contractorId);
    return Feedback.findByUser(contractorId);
  }

  findForToday() {
    var date = (new Date() / 1000) * 1000 - 96 * 60 * 60 * 1000;
    return Feedback.findAfterTime(date);
  }
}

var exports = (module.exports = new FeedbackController());
