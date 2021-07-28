"use strict";

var querystring = require("querystring");

const Q = require("q");

// Components

// Models
const Customer = include("models/customer");
const User = include("models/user");
const PaymentLog = include("models/paymentlog");

var stripe = require("stripe")("sk_test_ovTAQAAsyABZ9Q72fAMKEZr7");

class CardsController {
  constructor() {}

  async addCustomerCard(user, data) {
    var customerObj = new Customer(data);
    customerObj.user = user._id;
    const response = await customerObj.save();
    //return Promise.resolve(response);
    const customer = await stripe.customers.create({
      email: user.email,
      source: data.tokenInfo
    });

    if (!customer) {
      return Promise.reject({
        headerStatus: 200,
        status: 403,
        message: "Invalid Card information"
      });
    }
    const cards = await Customer.findByUserId(user._id);
    if (cards.length == 0) {
      response.defaultCard = true;
    }
    response.customerId = customer.id;
    const newCustomer = await response.save();
    return { status: 200, data: newCustomer };
    // return Promise.resolve(customer); //self.createCustomerSource(user, data, customer);
  }

  createCustomer(user, data) {
    var self = this;
    return stripe.customers.create(
      { email: data.email, source: data.tokenInfo },
      function(err, customer) {
        if (err) {
          console.log(err);
          return Promise.reject({
            headerStatus: 200,
            status: 403,
            message: "Invalid Card information"
          });
        }
        return Promise.resolve(customer); //self.createCustomerSource(user, data, customer);
      }
    );
  }

  createCustomerSource(user, data, customer) {
    return stripe.customers.createSource(
      customer.id,
      { source: data.tokenInfo },
      function(err, card) {
        if (err) {
          console.log(err);
          return Promise.reject({
            headerStatus: 200,
            status: 403,
            message: "Invalid Card information"
          });
        }
        console.log("card");
        console.log(card);
        console.log("card end");
        var customerObj = new Customer(data);
        return customerObj.save().then(function(result) {
          console.log(result);
          return Promise.resolve(result);
        });
      }
    );
  }

  async getCard(user) {
    const response = await Customer.findByUserId(user._id);
    return { status: 200, data: response };
  }

  async deleteCard(user, data) {
    console.log(data);
    const res = await Customer.deleteCardById(data._id);
    return this.getCard(user);
  }

  async charge(user, data, ip) {
    console.log(data);

    const customer = await Customer.findById(data._id);

    if (!customer || !customer.tokenInfo) {
      return Promise.reject({ status: 403, message: "Invalid Credit Card" });
    }
    var payment2 = new PaymentLog();
    payment2.amount = data.amount;
    payment2.currency = data.currency;
    payment2.description = data.description;
    payment2.order = data.order;
    payment2.user = user._id;
    payment2.ip = ip;
    await payment2.save();
    var chargeObject = {
      amount: data.amount * 100,
      currency: data.currency,
      // source: data.source, // obtained with Stripe.js
      customer: customer.customerId,
      description: data.description
    };
    console.log(chargeObject);
    return stripe.charges.create(chargeObject, function(err, charge) {
      // asynchronously called
      if (err) {
        console.log(err);
        return Promise.reject({
          headerStatus: 200,
          status: 403,
          message: "Invalid customer token"
        });
      }
      console.log(charge);
      // var payment = new PaymentLog();
      // payment.user = user._id;
      // payment.save();
      return Promise.resolve({
        headerStatus: 200,
        status: 200,
        message: "Successfully charged"
      });
    });
  }

  async updateDefault(user, data) {
    const res = await Customer.updateCardByUser(user._id);
    console.log("res:", res);
    console.log("data:", data);
    await Customer.updateCardById(data._id, true);
    return this.getCard(user);
  }
}

var exports = (module.exports = new CardsController());
