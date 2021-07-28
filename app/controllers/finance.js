"use strict";

const { response } = require("express");
const _ = require("lodash");
const { async } = require("q");
const Finance = include("models/finance");
const Order = include("models/order");
const Transporter = include("models/transporter");
const BankAccount = include("models/bank");

class FinanceController {
  async getAll() {
    const response = await Finance.findAll();
    return { status: 200, count: response.length, data: response };
  }

  async getStatus(user) {
    const response = await Finance.getStatus();
    return { status: 200, data: response };
  }

  async getTransporterStatus(user) {
    const response = await Finance.getTransporterStatus();
    return { status: 200, data: response };
  }

  async getById(user, id) {
    const response = await Finance.findById(id);
    return { status: 200, data: response };
  }

  add = async (user, data) => {
    data.status = "pending";
    if (!data.transporter || !data.order) {
      return { status: 400, message: "Parameters are missing" };
    }
    let f = await Finance.findOne({ order: data.order });
    if (f) {
      return { status: 400, message: "Order already exists" };
    }
    const order = await Order.findOne({ _id: data.order })
      .populate({ path: "rates", select: "total" })
      .select("transporter");

    let shippingCharges = order?.rates?.total;
    let percentage = order?.transporter?.percentage?.percentage;

    data.amount = (shippingCharges / 100) * percentage;
    // console.log(data);
    const finance = await Finance.create(data);
    return { status: 201, data: finance };
  };

  async pay(user, data) {
    let r = [];
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      let finance = await Finance.find({
        order: element.order,
        transporter: element.transporter,
        status: "pending",
      });
      if (finance.length < 1) {
        return { status: 401, message: "Request failed" };
      }
      element.lastPaidDate = new Date();
      element.lastPaidBy = user._id;
      element.status = "paid";
      const response = await Finance.updateStatus(
        element._id,
        element.transporter,
        element.order,
        element
      );
      r.push(response);
    }
    console.log(r);
    return { status: 200, data: r };
  }

  getByTransporter = async(user, transporter, status) => {
    const data = await Finance.transporterPaidUnPaidStatus(transporter, status);
    return { status: 200, data: data }
  }

  async transportersDetails(user, data) {
    // const finance = await Finance.find({ transporter: { $in: data.transporters } });
    // const finance = await Finance.aggregate([
    //   { $match : { transporter: { $in: mongoose.Types.ObjectId(data.transporters) } }  },
    // { $unwind: '$orders' },
    // {
    //   $lookup: {
    //     from: Order.collection.name,
    //     localField: "orders",
    //     foreignField: "_id",
    //     as: "orders",
    //   }
    // }
    // ]);
    const finance = await Finance.transportersDetails(data.transporters);

    return { status: 200, data: finance };

    let a = [];
    const transporters = await Finance.find({
      status: "paid",
      transporter: { $in: data.transporters },
    });
    for (let i = 0; i < transporters.length; i++) {
      const element = transporters[i];
      const t = await Transporter.find({ _id: { $in: element.transporter } });
      console.log(t.paid);
      for (let index = 0; index < t.length; index++) {
        const e = t[index];
        let arrayObject = {
          name: `${e.firstName} ${e.lastName}`,
          phone: e.mobile,
          totalOrders: e.totalOrders,
        };
        a.push(arrayObject);
      }
      // console.log(t);
    }

    return { status: 200, data: a };
  }

  async transporterEarningByDate(user, id, data) {
    if (!data.transporterIds) {
      const drivers = await Transporter.findMyDrivers(id);
      data.transporterIds = _.map(drivers, "_id");
      data.transporterIds.push(id);
    }

    const orders = await Order.earningByTransporterFilterByDate(data, id);
    let price = 0;
    orders.map((e) => (price += e.rates.price));
    const orderIds = _.map(orders, "_id");
    const finance = await Finance.findByOrderId(orderIds);
    // console.log(orderIds);
    const totalDeliveries = orders.length;
    return {
      status: 200,
      data: {
        orders,
        finance,
        record: { totalAmount: price, totalDeliveries },
      },
    };
  }

  async transporterEarningByMonth(user, id, data) {
    if (!data.transporterIds) {
      const drivers = await Transporter.findMyDrivers(id);
      data.transporterIds = _.map(drivers, "_id");
      data.transporterIds.push(id);
    }

    const orders = await Order.earningByTransporterFilterByMonth(data, id);

    let price = 0;
    orders.map((e) => (price += e.rates.price));

    const orderIds = _.map(orders, "_id");
    const finance = await Finance.findByOrderId(orderIds);
    // console.log(orderIds);
    const totalDeliveries = orders.length;
    return {
      status: 200,
      data: {
        orders,
        finance,
        record: { totalAmount: price, totalDeliveries },
      },
    };
  }

  async getReport(user, id, data) {
    if (!data.transporterIds) {
      const drivers = await Transporter.findMyDrivers(id);
      data.transporterIds = _.map(drivers, "_id");
      data.transporterIds.push(id);
    }

    const orders = await Order.earningByFilter(data, id);
    const orderIds = _.map(orders, "_id");
    const finance = await Finance.findByOrder(orderIds);

    return { status: 200, data: { finance, orders } };
  }

  async findByUser(user, contractorId) {
    const response = await Finance.findByUser(contractorId);
    return { status: 200, data: response };
  }

  findForToday() {
    var date = (new Date() / 1000) * 1000 - 96 * 60 * 60 * 1000;
    return Finance.findAfterTime(date);
  }
}

module.exports = new FinanceController();
