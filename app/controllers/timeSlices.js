const moment = require("moment");
const TimeSlice = require("../models/TimeSlice");
const Price = require("../models/price");
const Order = require("../models/order");
const Rate = require("../models/rates");

class TimeSliceController {
  constructor() {}

  async addSlice(req, res, next) {
    try {
      const data = req.body;
      data.transporter = data.transporter || req.user._id;
      // console.log(data);
      const response = await TimeSlice.create(data);
      return res.status(201).json({ status: 200, data: response });
    } catch (error) {
      return res.status(500).json({ status: "fail", error });
    }
  }

  async getSlice(req, res, next) {
    try {
      const data = await TimeSlice.find();
      res.status(200).json({ status: 200, count: data.length, data });
    } catch (error) {
      res.status(500).json({ status: "fail", error });
    }
  }

  async byTransporter(req, res, next) {
    try {
      const data = await TimeSlice.find({
        transporter: req.params.transporter || req.user._id,
      });
      res.status(200).json({ status: 200, data });
    } catch (error) {
      res.status(500).json({ status: "fail", error });
    }
  }

  async pwaTimeSlot(req, res, next) {
    const order = await Order.findOne({
      orderNumber: parseInt(req.params.order_id),
    });

    const rate = await Rate.findOne({ _id: order.rates });

    let sizes = [];
    let a = [];

    for (let i = 0; i < rate.items.length; i++) {
      const item = rate.items[i];
      if (item.size === "extra_large") {
        a.push({ size: 4, category: item.category });
      } else if (item.size === "large") {
        a.push({ size: 3, category: item.category });
      } else if (item.size === "medium") {
        a.push({ size: 2, category: item.category });
      } else if (item.size === "small") {
        a.push({ size: 1, category: item.category });
      }
    }

    let maxSize = 0;
    let category = "";
    a.forEach((s) => {
      if (s.size > maxSize) {
        maxSize = s.size;
        category = s.category;
      }
    });

    let maxSizeInString;

    if (maxSize === 4) {
      maxSizeInString = "extra_large";
    } else if (maxSize === 3) {
      maxSizeInString = "large";
    } else if (maxSize === 2) {
      maxSizeInString = "medium";
    } else if (maxSize === 1) {
      maxSizeInString = "small";
    }

    const pwaTimeSlot = await TimeSlice.pwaTimeSlot(req?.params?.transporter);

    let today = moment(new Date()).format("YYYY-MM-DD");
    today = new Date(today);
    const cat = await Price.findOne({
      store: order?.store,
      "services.size": maxSizeInString,
      $or: [{ endDate: { $gt: today } }, { endDate: { $eq: null } }],
    }).select("services.category");
    if (category === undefined) category = cat.services[0].category;

    const price = await Price.getPriceEcommerce(
      order?.store,
      maxSizeInString,
      category
    );

    // delete undefined Object keys
    Object.keys(price).forEach((key) => {
      if (price[key] === undefined) {
        delete price[key];
      }
    });

    // Object key to lowercase
    let key,
      keys = Object.keys(price);
    let n = keys.length;
    let newobj = {};
    while (n--) {
      key = keys[n];
      newobj[key.toLowerCase()] = price[key];
    }

    let services = Object.keys(newobj);
    let prices = Object.values(newobj);
    res
      .status(200)
      .json({ status: 200, data: { services, prices, pwaTimeSlot } });
  }

  async showTimeslots(req, res, next) {
    const showTimeslots = await TimeSlice.showTimeslots(req.params.transporter);
    return res.status(200).json({ status: 200, data: showTimeslots });
  }

  async deleteByTransporter(req, res, next) {
    try {
      const timeSlot = await TimeSlice.findOne({ _id: req.params.id });
      if (!timeSlot)
        return res.status(400).json({ status: 400, message: "id not found" });
      await TimeSlice.deleteOne({ _id: req.params.id });
      return res
        .status(200)
        .json({ status: 200, message: "deleted successfully" });
    } catch (error) {
      res.status(500).json({ status: "fail", error });
    }
  }
}

module.exports = new TimeSliceController();
