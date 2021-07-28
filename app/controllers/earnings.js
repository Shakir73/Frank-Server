const _ = require("lodash");
const Earning = require("../models/Earning");
const Order = require("../models/order");
const Transporter = require("../models/transporter");

class EarningController {
  constructor() {}

  async addEarning(req, res, next) {
    const { transporters, percentage, addedBy } = req.body;
    let logger = {
      addedBy: addedBy || req.user,
    };
    if (!transporters || !percentage)
      return res
        .status(400)
        .json({ status: "fail", message: "Parameters are missing" });
    for (let i = 0; i < transporters.length; i++) {
      const e = transporters[i];
      let t = await Earning.findOne({ transporters: e });
      if (t) {
        await Earning.findOneAndUpdate(
          { transporters: e },
          { $set: { percentage } },
          { $addToSet: { logger } },
          // { new: true }
        );
      } else {
        let earning = await Earning({ transporters: e, percentage, logger });
        earning.save();
      }
    }
    return res.status(200).json({ data: "Percentage added successfully" });
  }

  async getAll(req, res, next) {
    const earnings = await Order.transportersPendingOrPaidStatus(req.params.transporter);
      if (req.params.transporter) {
        return res.status(200).json({ data: earnings[0] });
      } else {
        return res.status(200).json({ data: earnings });
      }
  }

  getAllEarnings = async (req, res, next) => {
    try {
      const earnings = await Earning.find();
      return res.status(200).json({ count: earnings.length, data: earnings });
    } catch (error) {
      res.status(400).json({
        status: "fial",
        message: error,
      });
    }
  };

  // async getByTransporter(req, res, next) {
  //   try {
  //     const id = req.params.id;
  //     const earning = await Earning.findOne({ transporters: id });
  //     return res.status(200).json({ data: earning });
  //   } catch (error) {
  //     return res.status(400).json({
  //       status: "fial",
  //       message: error,
  //     });
  //   }
  // }

  // async getById(req, res, next) {
  //   try {
  //     const id = req.params.id;
  //     const earning = await Earning.findById(id);
  //     return res.status(200).json({ data: earning });
  //   } catch (error) {
  //     return res.status(400).json({
  //       status: "fial",
  //       message: error,
  //     });
  //   }
  // }

  async updateByTransporter(req, res, next) {
    try {
      const { percentage, transporters } = req.body;
      const transporter = await Earning.find({
        transporters: { $in: transporters },
      });
      let logger = {
        addedBy: req.user,
      };

      if (transporter.length > 0) {
        await Earning.updateMany(
          { transporters: { $in: transporters } },
          { $set: { percentage } },
          { $addToSet: { logger } },
          // { new: true }
        );
        return res.status(200).json({ message: "Percentage updated" });
      }
    } catch (error) {
      res.status(400).json({
        status: "fial",
        message: error,
      });
    }
  }

  async updateById(req, res, next) {
    try {
      const id = req.params.id;
      const { percentage } = req.body;

      let logger = {
        addedBy: req.user,
      };

      const earning = await Earning.findOneAndUpdate(
        { _id: id },
        { $set: { percentage } },
        { new: true }
      );

      await Earning.findOneAndUpdate(
        { _id: id },
        { $addToSet: { logger } },
        { new: true }
      );

      return res.status(200).json({ data: earning });
    } catch (error) {
      res.status(400).json({
        status: "fial",
        message: error,
      });
    }
  }

  async deleteEarningByTransporter(req, res, next) {
    const id = req.params.id;
    await Earning.deleteOne({ transporters: id });
    return res.status(204).json({ message: "Deleted successfully" });
  }

  async deleteEarningById(req, res, next) {
    const id = req.params.id;
    await Earning.deleteOne({ _id: id });
    return res.status(204).json({ message: "Deleted successfully" });
  }

  async search(req, res, next) {
    // job done on 30-04-2021
    try {
      const transporter = await Transporter.find({
        transporterType: { $ne: "driver" },
        $or: [
          { firstName: { $regex: req.body.text, $options: "i" } },
          { lastName: { $regex: req.body.text, $options: "i" } },
          { email: { $regex: req.body.text, $options: "i" } },
          { mobile: { $regex: req.body.text, $options: "i" } },
        ],
      });
      // let ids = transporter.map((t) => t._id);
      let ids = _.map(transporter, "_id");
      const response = await Earning.find({ transporters: { $in: ids } });
      const orders = await Order.find({ transporter: { $in: ids } }).populate({
        path: "rates",
        select: "total",
      });
      let rates = orders.map(
        (el) =>
          (el.rates.total / 100) * el.transporter ||
          "".percentage ||
          "".percentage ||
          0
      );
      let t = rates.reduce((acc, curr) => acc + curr, 0);
      let totalOrders = orders.length;
      response.push({ totalAmount: t, totalOrders });

      return res.status(200).json({ data: response });
    } catch (error) {
      res.status(400).json({
        status: "fial",
        message: error,
      });
    }
  }
}

module.exports = new EarningController();
