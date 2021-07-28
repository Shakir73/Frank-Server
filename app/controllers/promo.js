"use strict";

const User = include("models/user");
const Promo = include("models/promo");
const Promotion = require('../models/Promotion');

class PromoController {
  async getAll(user) {
    return Promo.findAll();
  }

  async applyPromo(user, data) {
    console.log(data);
    const response = await Promo.applyPromo(user._id, data.code.toLowerCase());

    if (!response) {
      return {
        status: 403,
        message:
          "The promo code is not valid, make sure you did not make any typo",
      };
    }
    console.log(response);
    return { status: 200, data: response };
  }

  async addPromo(data) {
    var code = data.code.toLowerCase();
    data.code = code;
    console.log(data);
    var promo = new Promo(data);
    await promo.save();
    return { status: 200, data: promo };
  }

  async expirePromo(user, data) {
    return Promo.expirePromo(data._id);
  }

  async updateExpiryDate(user, data) {
    const promo = await Promotion.findOneAndUpdate(
     { _id: data._id},
      {$set: { endDate: data.endDate }},
      {new: true},
    );
    return { status: 200, data: promo };
    // return Promo.updateExpiryDate(data);
  }

  async getActivePromotions(user) {
    return { status: 200, data: await Promo.findActivePromotions(user._id) };
  }
}

var exports = (module.exports = new PromoController());
