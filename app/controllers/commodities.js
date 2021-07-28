"use strict";

const Q = require("q");
var fs = require("fs");

const Commodity = include("models/commodity");
const Order = include("models/order");
const Admin = include("models/admin");
const ModificationLog = include("models/modificationlog");
var randomstring = require("randomstring");

class CommoditiesController {
  async create(data) {
    console.log(data);
    let commodity = new Commodity(data);
    await commodity.save();
    return { status: 200, data: commodity };
  }

  async updateById(user, data) {
    let admin = await Admin.findById(user._id);
    if (admin) {
      let order = await Order.findByCommodityId(data._id);
      let confirmationCode = randomstring.generate({
        length: 4,
        charset: "numeric"
      });
      let modify = new ModificationLog({
        order: order._id,
        commodity: data._id,
        updatedBy: user._id,
        isCommodity: true,
        changelog: data,
        confirmationCode: confirmationCode
      });
      await modify.save();
    }

    let commodity = await Commodity.updateById(data._id, data);
    return { status: 200, data: commodity };
  }
}

var exports = (module.exports = new CommoditiesController());
