"use strict";
const Q = require("q");
const request = require("request");
const Rates = include("models/rates");
const Zone = include("models/zone");

const timeTravel = { standard: 0.6, urgent: 0.7, economy: 0.7 };
class RatesController {
  updateRates(user, data) {
    return Rates.updateRatesById(data._id, data);
  }

  add(user, data) {
    var rate = new Rates(data);
    rate.addedBy = user._id;
    // var ratesArray = [];
    // for (var i = 0; i < data.rates.length; i++) {
    //   var r = data.rates[i];
    //   var rate = new Rates(r);
    //   rate.save();
    //   ratesArray.push(rate);
    // }
    return rate.save();
  }

  getAll() {
    return Rates.find({ active: true, calculated: { $ne: true } }).exec();
  }

  async getRatesWithParam(data) {
    // console.log(data);
    console.log("start calculation");
    const pickupZone = { priceFactor: 1.25 }; // await Zone.findByCoordinates(data.pickup.location);
    const dropoffZone = { priceFactor: 1.25 }; //await Zone.findByCoordinates(data.dropoff.location);
    console.log("zone found");
    // console.log("pickup zone:", pickupZone);
    // console.log("dropoff zone:", dropoffZone);
    const d = Math.max(1, data.distance);
    const t = 1; // timeTravel[data.type];
    const w = data.weight;
    const u = 0.3;
    const z0 = pickupZone != null ? pickupZone.priceFactor || 1.5 : 1.5;
    const z1 = dropoffZone != null ? dropoffZone.priceFactor || 1.5 : 1.5;
    const a = 0;
    const c = 0;
    const discount = 0;
    console.log(d, t, w);
    let basicRate = (d / Math.pow(d, t)) * Math.pow(w, u) * ((z0 + z1) / 2);
    let finalRate = Math.max(
      14,
      Math.ceil(basicRate + a + c + (data.priceImpact || 0))
    );
    // console.log("zone Factor 0:", z0);
    // console.log("zone Factor 1:", z1);
    // console.log("final:", finalRate);
    // if (data.config.currency.toLowerCase() != "eur") {
    //   const conversionRate = await this.getConversionRate();
    //   finalRate = (finalRate * conversionRate.EUR_USD).toFixed(2);
    // }
    let rates = new Rates({
      price: finalRate,
      minPrice: finalRate,
      maxPrice: Math.ceil(finalRate * 1.3),
      actualPrice: finalRate,
      calculated: true,
    });
    await rates.save();
    return { rates, z0, z1 };
    // return Rates.findByParams(data);
  }

  async getRatesByEachCommodity(data, z0, z1) {
    // console.log("start calculation");
    // const pickupZone = await Zone.findByCoordinates(data.pickup.location);
    // const dropoffZone = await Zone.findByCoordinates(data.dropoff.location);
    // console.log("zone found");
    // console.log("pickup zone:", pickupZone);
    // console.log("dropoff zone:", dropoffZone);
    const d = Math.max(1, data.distance);
    const t = timeTravel[data.type];
    const w = data.weight;
    const u = 0.3;
    // const z0 = pickupZone != null ? pickupZone.priceFactor || 1.5 : 1.5;
    // const z1 = dropoffZone != null ? dropoffZone.priceFactor || 1.5 : 1.5;
    const a = 0;
    const c = 0;
    const discount = 0;
    console.log(d, t, w);
    let basicRate = (d / Math.pow(d, t)) * Math.pow(w, u) * ((z0 + z1) / 2);
    let finalRate = Math.max(
      14,
      Math.ceil(basicRate + a + c + (data.priceImpact || 0))
    );
    // console.log("zone Factor 0:", z0);
    // console.log("zone Factor 1:", z1);
    // console.log("final:", finalRate);
    // if (data.config.currency.toLowerCase() != "eur") {
    //   const conversionRate = await this.getConversionRate();
    //   finalRate = (finalRate * conversionRate.EUR_USD).toFixed(2);
    // }
    let rates = {
      price: finalRate,
      minPrice: finalRate,
      maxPrice: Math.ceil(finalRate * 1.3),
      actualPrice: finalRate,
      actualPriceMin: finalRate,
      actualPriceMax: Math.ceil(finalRate * 1.3),
      calculated: true,
    };
    return rates;
    // return Rates.findByParams(data);
  }

  getConversionRate() {
    return Q.Promise((resolve, reject, notify) => {
      var url =
        "https://free.currconv.com/api/v7/convert?q=EUR_USD&compact=ultra&apiKey=c1045326952dfcc1535e";
      var options = {
        method: "GET",
        url: url,
        headers: { "content-type": "application/json" },
      };

      request(options, function (error, response, body) {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          try {
            console.log(body);
            var obj = JSON.parse(body);

            resolve(obj);
          } catch (e) {
            reject({ status: 403, message: "Not found" });
          }
        }
      });
    });
  }
}

var exports = (module.exports = new RatesController());
