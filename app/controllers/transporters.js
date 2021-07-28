var _ = require("lodash");
const request = require("request");
const Transporter = include("models/transporter");
const User = include("models/user");
const Order = include("models/order");
const Rates = include("models/rates");
const Journey = include("models/journey");
const ServiceArea = include("models/servicearea");
const Vehicle = include("models/vehicle");
const Finance = include("models/finance");
const Earning = require("../models/Earning");
const GuardComponent = require('../components/guards');
var usersController = include("controllers/users");
const md5 = require("md5");
const Q = require("q");
var randomstring = require("randomstring");
const { async } = require("q");

var accountSid = "AC23fffd5d1c827dafb06dd727d2eedb7d"; // Your Account SID from www.twilio.com/console
var authToken = "6e62bb8a2c69afef5a1b501318def7f5"; // Your Auth Token from www.twilio.com/console

const client = require("twilio")(accountSid, authToken);

class TransportersController {
  constructor() {
    this.authComponent = GuardComponent;
  }
  async login(data) {
    if (!data.email || !data.password) {
      return { status: 400, message: "Parameters missing" };
    }
    // let mobile = data.mobile;
    // if (mobile.startsWith("+")) {
    //   data.mobile = mobile.substring(1, mobile.length);
    // }
    data.password = md5(data.password);
    const user = await Transporter.login(data);
    if (!user) return { status: 401, message: "Invalid Credentials" };
    if (user.banned)
      return { status: 401, message: "Your account has been suspended" };
    // if (!user.active)
    //   return {
    //     status: 401,
    //     message: "Your account has not been activated yet"
    //   };

    user.smsCode = randomstring.generate({ length: 4, charset: "numeric" });
    await user.save();
    const userObject = await this.authComponent.encodeToken(user.toObject());
    // this.sendSMS({
    //   mobile: data.mobile,
    //   message:
    //     "Your PPost Transporter App verification code is: " + user.smsCode
    // });
    return { status: 200, data: userObject };
  }

  async signup(res, data) {
    if (!data.email || !data.password || !data.firstName || !data.mobile) {
      return { status: 400, message: "Parameter missing" };
    }
    // if (
    //   data.mobile != "33626201988" &&
    //   data.mobile != "994502559728" &&
    //   data.mobile != "994502927557" &&
    //   data.mobile != "33617754285" &&
    //   data.mobile != "33650520180" &&
    //   data.mobile != "330677105314"
    // ) {
    //   return { status: 400, message: "Not allowed" };
    // }

    let mobile = data.mobile;
    if (mobile.startsWith("+")) {
      data.mobile = mobile.substring(1, mobile.length);
    }
    let user = await Transporter.findByEmailOrMobile(data.email, data.mobile);

    if (user && user.isVerified) {
      if (user.mobile === data.mobile) {
        return { status: 403, message: "Mobile number already exists" };
      }
      return { status: 403, message: "Email already exists" };
    }

    if (!user) {
      data.emailCode = randomstring.generate({ length: 4, charset: "numeric" });
      data.smsCode = randomstring.generate({ length: 4, charset: "numeric" });
      data.password = md5(data.password);
      user = new Transporter(data);
    } else {
      data.password = md5(data.password);
      await Transporter.updateTransporter(user._id, data);
      data.smsCode = user.smsCode;
      data.emailCode = user.emailCode;
    }

    let transporter = await user.save();
  
    await Earning.create({ transporters: transporter._id, percentage: 80 });

    await this.sendSMS({
      mobile: data.mobile,
      message:
        "Your PPost Transporter App verification code is: " + data.smsCode,
    });
    await this.createUser(data);

    const userObject = await this.authComponent.encodeToken(user.toObject());
    return Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "verification",
        {
          from: "support@hitechsolution.io",
          to: data.email,
          subject: "Frank OTP Verification",
          context: {
            otherProperty:
              "Your Frank Transporter App Email verification code is " +
              data.emailCode,
          },
        },
        function (err) {
          if (err) {
            reject({
              status: 401,
              message: "There was an error sending email, please try again",
            });
            return;
          }
          resolve({ status: 200, data: userObject });
        }
      );
    });
  }

  async createTransporter(data) {
    if (!data.email || !data.password || !data.firstName || !data.mobile) {
      return { status: 400, message: "Parameter missing" };
    }
    // if (
    //   data.mobile != "33626201988" &&
    //   data.mobile != "994502559728" &&
    //   data.mobile != "994502927557" &&
    //   data.mobile != "33617754285" &&
    //   data.mobile != "33650520180" &&
    //   data.mobile != "330677105314"
    // ) {
    //   return { status: 400, message: "Not allowed" };
    // }

    let mobile = data.mobile;
    if (mobile.startsWith("+")) {
      data.mobile = mobile.substring(1, mobile.length);
    }
    let user = await Transporter.findByEmailOrMobile(data.email, data.mobile);

    if (user && user.isVerified) {
      if (user.mobile === data.mobile) {
        return { status: 403, message: "Mobile number already exists" };
      }
    }

    if (!user) {
      // data.isVerified = true;
      data.password = md5(data.password);
      user = new Transporter(data);
    } else {
      // data.isVerified = true;
      data.password = md5(data.password);
      user = await Transporter.updateTransporter(user._id, data);
    }

    await user.save();
    return { status: 200, data: user };
  }

  async createUser(data) {
    if (
      !data.email ||
      !data.password ||
      !data.lastName ||
      !data.firstName ||
      !data.mobile
    ) {
      return { status: 400, message: "Parameters missing" };
    }
    // if (
    //   data.mobile != "33626201988" &&
    //   data.mobile != "994502559728" &&
    //   data.mobile != "994502927557" &&
    //   data.mobile != "33617754285" &&
    //   data.mobile != "33650520180" &&
    //   data.mobile != "330677105314"
    // ) {
    //   return { status: 400, message: "Not allowed" };
    // }
    let mobile = data.mobile;
    if (mobile.startsWith("+")) {
      data.mobile = mobile.substring(1, mobile.length);
    }
    const user = await User.findByEmailOrMobile(data);
    if (user) return { status: 403, message: "User already exists" };

    data.password = md5(data.password);
    // data.isVerified = true;

    var userObject = new User(data);
    await userObject.save();

    return { status: 200, data: userObject };
  }

  async verify(_user, data) {
    let user =
      _user != null
        ? await Transporter.findById(_user._id)
        : await Transporter.findByMobile(data.mobile);
    const userObject = await Transporter.verify(user._id, data);
    if (userObject) {
      const updatedObject = await Transporter.updateTransporter(user._id, {
        isVerified: true,
      });
      let userObj = await User.findByMobile(updatedObject.mobile);
      if (userObj) {
        await User.updateUser(userObj._id, {
          isVerified: true,
          active: true,
        });
      }

      const newUser = await this.authComponent.encodeToken(
        updatedObject.toObject()
      );

      return {
        status: 200,
        data: newUser,
      };
    }

    return { status: 403, message: "Invalid verification code" };
  }

  async loginMobile(data) {
    let mobile = data.mobile;
    if (mobile.startsWith("+")) {
      data.mobile = mobile.substring(1, mobile.length);
    }
    const userObject = await Transporter.findByMobile(data.mobile);
    if (!userObject) {
      return {
        status: 401,
        message: "Invalid mobile number",
      };
    }
    if (userObject.banned)
      return { status: 401, message: "Your account has been suspended" };
    userObject.smsCode = randomstring.generate({
      length: 4,
      charset: "numeric",
    });
    await userObject.save();
    if (!userObject.twoFactorLogin) {
      this.sendSMS({
        mobile: data.mobile,
        message:
          "Your PPost Transporter App verification code is: " +
          userObject.smsCode,
      });
    }

    let result = {
      twoFactorLogin: userObject.twoFactorLogin,
      isVerified: userObject.isVerified,
    };
    if (!userObject.isVerified) {
      const newUser = await this.authComponent.encodeToken(
        userObject.toObject()
      );
      result.user = newUser;
      // result.token = newUser.token;
    }
    return {
      status: 200,
      message: "A verification SMS has been sent to your mobile number",
      data: result,
    };
  }

  async verifyLogin(data) {
    let mobile = data.mobile;
    if (mobile.startsWith("+")) {
      data.mobile = mobile.substring(1, mobile.length);
    }
    const user = await Transporter.verifyLogin(data);
    if (user) {
      const updatedObject = await Transporter.updateTransporter(user._id, {
        isVerified: true,
      });
      const userObject = await this.authComponent.encodeToken(
        updatedObject.toObject()
      );
      return {
        status: 200,
        data: userObject,
      };
    }
    return { status: 403, message: "Invalid verification code" };
  }

  async forgotPassword(res, data) {
    const user = await Transporter.findByMobile(data.mobile);

    if (!user) {
      // res.send({headerStatus: 200, status: 401, message: 'There was an error sending email, please try again'});
      return Promise.reject({
        headerStatus: 401,
        status: 401,
        message: "No user found on this number",
      });
    }
    var code = randomstring.generate(8);
    user.recoveryCode = code;
    console.log(code);
    await user.save();
    this.sendSMS({
      mobile: user.mobile,
      message: "Your PPost Transporter App Password reset code is " + code,
    });
    return {
      status: 200,
      data: { message: "Recovery code sent to your number" },
    };
  }

  async verifyRecoveryCode(data) {
    let user = await Transporter.findByMobile(data.mobile);
    if (!user) {
      return {
        status: 400,
        data: { message: "Invalid mobile number" },
      };
    }
    if (data.recoveryCode == user.recoveryCode) {
      return {
        status: 200,
        data: {
          message:
            "Code validated successfully, you can now reset your password",
        },
      };
    } else {
      return {
        status: 403,
        data: { message: "Invalid verification code" },
      };
    }
  }

  async activate(user, data) {
    return Transporter.activate(data.transporter);
  }

  async blockDriver(user, data) {
    return Transporter.blockDriver(data.driver, data.blocked);
  }

  async getIdenfyData(user, id) {
    return Q.Promise(async (resolve, reject, notify) => {
      let existingUser = await Transporter.findById(id);
      if (!existingUser) {
        return resolve({
          status: 401,
          message: "Invalid user id",
        });
      }

      if (!existingUser.idenfyScanRef) {
        return resolve({
          status: 403,
          message: "Idenfy Verification incomplete",
        });
      }
      var url = "https://ivs.idenfy.com/api/v2/files";
      var options = {
        method: "POST",
        url: url,
        headers: {
          "content-type": "application/json",
          Authorization:
            "Basic " + "ZFk2ZkhwY25HSms6aUtIQXpWNFFqcVZycE43eGJZdXY=",
        },
        body: JSON.stringify({ scanRef: existingUser.idenfyScanRef }),
      };

      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          try {
            var obj = JSON.parse(body);
            resolve({ status: 200, data: obj });
          } catch (e) {
            reject({ status: 403, message: "Not found" });
          }
        }
      });
    });
  }

  async checkIdenfyStatus(user, id) {
    return Q.Promise(async (resolve, reject, notify) => {
      let existingUser = await Transporter.findById(id);
      if (!existingUser) {
        return resolve({
          status: 401,
          message: "Invalid user id",
        });
      }
      if (!existingUser.idenfyScanRef) {
        return resolve({
          status: 403,
          message: "Idenfy Verification incomplete",
        });
      }
      var url = "https://ivs.idenfy.com/api/v2/status";
      var options = {
        method: "POST",
        url: url,
        headers: {
          "content-type": "application/json",
          Authorization:
            "Basic " + "ZFk2ZkhwY25HSms6aUtIQXpWNFFqcVZycE43eGJZdXY=",
        },
        body: JSON.stringify({ scanRef: existingUser.idenfyScanRef }),
      };

      request(options, function (error, response, body) {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          try {
            var obj = JSON.parse(body);
            resolve({ status: 200, data: obj });
          } catch (e) {
            reject({ status: 403, message: "Not found" });
          }
        }
      });
    });
  }

  async updatePassword(data) {
    let existingUser = await Transporter.findByMobile(data.mobile);
    if (!existingUser) {
      return {
        status: 403,
        data: { message: "Invalid email" },
      };
    }

    if (data) {
      if (data.password && data.recoveryCode == existingUser.recoveryCode) {
        existingUser.password = md5(data.password);
      } else {
        return {
          status: 403,
          data: { message: "Invalid verification code" },
        };
      }
    }
    await existingUser.save();
    return { status: 200, data: existingUser };
  }

  async changePassword(user, data) {
    let userObject = await Transporter.findByIdSelectPassword(user._id);
    if (md5(data.oldPassword) === userObject.password) {
      const updatedUser = await Transporter.updateTransporter(user._id, {
        password: md5(data.newPassword),
      });
      return { status: 200, data: updatedUser };
    }
    return { status: 401, message: "Invalid Password" };
  }

  async changeEmail(user, data) {
    let userObject = await Transporter.findById(user._id);
    if (!userObject) {
      return { status: 401, message: "Invalid User" };
    }
    const updatedUser = await Transporter.updateTransporter(user._id, {
      email: data.email,
    });
    return { status: 200, data: updatedUser };
  }

  async resendCode(res, user, data) {
    const userObject = await Transporter.findByMobile(data.mobile);
    this.sendSMS({
      mobile: userObject.mobile,
      message:
        "Your PPost Transporter App verification code is: " +
        userObject.smsCode,
    });
    if (userObject.isVerified) {
      return {
        status: 200,
        data: { message: "Code has been sent successfully" },
      };
    }
    return Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "verification",
        {
          from: "support@hitechsolution.io",
          to: userObject.email,
          subject: "Frank OTP Verification",
          context: {
            otherProperty:
              "Your Frank Transporter App Email verification code is " +
              userObject.emailCode,
          },
        },
        function (err) {
          if (err) {
            console.log(err);
            reject({
              status: 401,
              message: "There was an error sending email, please try again",
            });
            return;
          }
          resolve({
            status: 200,
            data: { message: "Code has been sent successfully" },
          });
        }
      );
    });
  }

  async update(user, data) {
    const transporter = await Transporter.updateTransporter(user, data);
    return { status: 200, data: transporter };
  }

  async updateAdmin(user, data) {
    const transporter = await Transporter.updateTransporter(data._id, data);
    return { status: 200, data: transporter };
  }

  async addDestination(user, data) {
    if (data.travellingInfo) {
      const journey = new Journey(data.travellingInfo);
      await journey.save();
      await Transporter.addJourney(
        data.travellingInfo.driver || user._id,
        journey._id
      );
      const transporter = await Transporter.findById(
        data.travellingInfo.driver || user._id
      );
      return { status: 200, data: transporter };
    }
    return { status: 400, data: { message: "Missing Required Parameters" } };
  }

  async deleteJourney(user, data) {
    await Journey.deleteById(data._id);
    await Transporter.deleteJourneyById(user._id, data._id);
    const transporter = await Transporter.findById(user._id);
    return { status: 200, data: transporter };
  }

  async updateDestination(user, data) {
    if (data.travellingInfo) {
      await Journey.updateById(data._id, data.travellingInfo);

      const transporter = await Transporter.findById(user._id);
      return { status: 200, data: transporter };
    }
    return { status: 400, data: { message: "Missing Required Parameters" } };
  }

  async getAll(user, type) {
    const transporters = await Transporter.findAll(type);
    return { status: 200, count: transporters.length, data: transporters };
  }

  async getById(id) {
    var data = await Transporter.findById(id);
    let fleetmanager = await Transporter.findById(data.admin);
    let pending = await Order.countMyRequests(id, "pending");
    let accepted = await Order.countMyRequests(id, "accepted");
    let picked = await Order.countMyRequests(id, "picked");
    let delivered = await Order.countMyRequests(id, "delivered");
    let cancelled = await Order.countMyRequests(id, "cancelled");
    let finance = await Finance.find({ transporter: id });
    let percentage = data?.percentage?.percentage;

    let totalOrders = await Order.count({ transporter: { _id: id } });
    data.totalOrders = totalOrders;
    // let vehicles = await Vehicle.getByTransporter(id);
    let object = { data: data._doc };
    let stats = { accepted, pending, picked, delivered, cancelled };
    return {
      status: 200,
      data: { ...object.data, stats, fleetmanager, finance, percentage },
    };
  }

  async getCustomersWorkedWith(user, id) {
    const orders = await Order.findByTransporter(id, "all");

    let ids = _.map(orders, "user");

    let counts = await Order.countByTransporterAndUser(id, "completed");
    console.log(counts);
    let countObject = {};
    for (let index = 0; index < counts.length; index++) {
      const element = counts[index];
      countObject[element._id] = element.count;
    }
    const users = await User.findByIds(ids);
    let respnse = { users, orders: countObject };
    return { status: 200, data: respnse };
  }

  async filter(user, data) {
    let result = [];
    if (
      (data.minAge && data.maxAge) ||
      (data.minRequests && data.maxRequests)
    ) {
      result = await Transporter.filter(data);
    }
    if (data.itemType) {
      let orders = await Order.findByCommodityId(data.itemType);
      if (orders.length > 0) {
        console.log("what is it");
        let ids1 = _.map(result, "_id");
        let ids = _.map(orders, "transporter");
        ids1 = [...ids, ...ids1];
        console.log(ids1);
        result = await Transporter.findByIds(ids1);
      }
    }

    return { status: 200, data: result };
  }

  async deleteVehicleById(user, id) {
    await Vehicle.findByIdAndDelete(id);
    return { status: 204, message: "Vehicle deleted successfully" };

    // let t = await Transporter.findById(user._id);
    // if (t.banned) {
    //   return { status: 403, message: "Your account has been suspended" };
    // }
    // await Vehicle.deleteById(id);
    // await Transporter.deleteVehicleById(user._id, id);
    // return this.getById(user._id);
  }

  async findNearby(data) {
    const serviceAreas = await Journey.findNearby(data.location);

    const transporters = _.map(serviceAreas, "_id");
    // const result = await Transporter.findNearby(data.location);
    const result = await Transporter.findByJourneys(transporters);

    // const ids = _.map(result, "_id");
    // const result2 = await Transporter.findNearbyTravellers(data.location, ids);

    // const final = result2.concat(result);
    return { status: 200, data: result };
  }

  async findSpecific(data) {
    const journeys = await Journey.findForLocation(
      data.location,
      data.type === "pickup"
    );
    const transporters = _.map(journeys, "_id");
    const result = await Transporter.findByJourneys(transporters);
    return { status: 200, data: result };
  }

  async banTransporter(user, data) {
    return Transporter.updateTransporter(data.transporter, {
      banned: data.banned,
    });
  }

  async addServiceArea(user, data) {
    if (data.type === "polygon") {
      data.transporter = data.driver || user._id;
      const serviceArea = new ServiceArea(data);
      await serviceArea.save();
      return { status: 200, data: serviceArea };
    } else {
      data.location["transporter"] = data.location.driver || user._id;
      const serviceArea = new ServiceArea(data.location);
      await serviceArea.save();
      return { status: 200, data: serviceArea };
    }
  }

  async allServiceareas(user) {
    const serviceAreas = await ServiceArea.find();
    return { status: 200, data: serviceAreas };
  }

  async deleteServiceArea(user, id) {
    try {
      await ServiceArea.deleteById(id);
      return {
        status: 200,
        data: { message: "Service area successfully deleted" },
      };
    } catch (error) {
      return { status: 403, data: { message: "An error occured" } };
    }
  }

  async addCustomServiceArea(user, data) {
    data.transporter = user._id;
    const serviceArea = new ServiceArea(data);
    await serviceArea.save();
    return { status: 200, data: serviceArea };
  }

  async getServiceAreas(user, id) {
    const data = await ServiceArea.findByTransporter(id || user._id);
    return { status: 200, data };
  }

  async addDriver(res, user, data) {
    let t = await Transporter.findById(user._id);
    if (t.banned) {
      return { status: 403, message: "Your account has been suspended" };
    }
    if (!data.email || !data.firstName || !data.mobile) {
      return { status: 400, message: "Parameter missing" };
    }

    const adminTransporter = await Transporter.findById(user._id);

    let driver = await Transporter.findByEmailOrMobile(data.email, data.mobile);
    if (driver && driver.isVerified) {
      if (!driver.deleted) {
        if (driver.mobile === data.mobile) {
          return { status: 403, message: "Mobile number already exists" };
        }
        if (driver.email === data.email) {
          return { status: 403, message: "Email already exists" };
        }
      }
      return { status: 403, message: "Email or Mobile already exists" };
    }
    let tempPassword = randomstring.generate({
      length: 8,
      charset: "alphanumeric",
    });
    if (!driver) {
      data.emailCode = randomstring.generate({ length: 4, charset: "numeric" });
      data.smsCode = randomstring.generate({ length: 4, charset: "numeric" });
      data.password = md5(tempPassword);
      data.admin = user._id;
      data.isSubDriver = true;
      driver = new Transporter(data);
    } else {
      await Transporter.updateTransporter(driver._id, data);
      data.smsCode = user.smsCode;
      data.emailCode = user.emailCode;
    }

    await driver.save();
    this.sendSMS({
      mobile: data.mobile,
      message:
        adminTransporter.firstName +
        " added you as driver in PPost Transporter App. Enter verification code " +
        data.smsCode +
        " to complete your registration. Your temporary password is: " +
        tempPassword,
    });
    const userObject = await this.authComponent.encodeToken(driver.toObject());
    return Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "verification",
        {
          from: "support@hitechsolution.io",
          to: data.email,
          subject: "Welcome to PPost Transporter",
          context: {
            otherProperty:
              adminTransporter.firstName +
              " added you as driver in PPost Transporter App. Enter verification code " +
              data.emailCode +
              " to complete your registration",
          },
        },
        function (err) {
          if (err) {
            resolve({ status: 200, data: userObject });
            return;
          }
          resolve({ status: 200, data: userObject });
        }
      );
    });
  }

  async search(user, text) {
    return Transporter.search(text);
  }

  async getDrivers(user) {
    let drivers = await Transporter.findMyDrivers(user._id);
    for (let index = 0; index < drivers.length; index++) {
      const element = { ...drivers[index]._doc };
      element["orders"] = 0;
      element["earning"] = 0;

      drivers[index] = element;
    }
    return { status: 200, data: drivers };
  }

  async deleteDriver(user, driver) {
    await Transporter.deleteDriver(user._id, driver);
    return this.getDrivers(user);
  }

  async getStats(user, data) {
    let me = await Transporter.findById(user._id);
    let drivers = await Transporter.findMyDrivers(user._id);
    const ids = _.map(drivers, "_id");
    ids.push(me._id);
    const all = await Order.getCountBetweenDatesByTransporter(ids, {
      ...data,
    });
    const pending = await Order.getCountBetweenDatesByTransporter(ids, {
      ...data,
      status: "pending",
    });
    const inprogress = await Order.getCountBetweenDatesByTransporter(ids, {
      ...data,
      status: "accepted",
    });
    const delivered = await Order.getCountBetweenDatesByTransporter(ids, {
      ...data,
      status: "delivered",
    });
    const cancelled = await Order.getCountBetweenDatesByTransporter(ids, {
      ...data,
      status: "cancelled",
    });

    const allTimeRecord = await Order.countByTransporterAndStatus(
      ids,
      "pending"
    );

    const earning = await Order.earningByFilter({
      ...data,
      transporterIds: ids,
    });
    const rateIds = _.map(earning, "rates._id");
    const earningReport = await Rates.getEarningsReport(rateIds, data);

    return {
      status: 200,
      data: {
        all,
        pending,
        inprogress,
        delivered,
        cancelled,
        allTimeRecord,
        earningReport,
      },
    };
  }

  sendSMS(data) {
    var object = {
      body: data.message,
      to: "+" + data.mobile, // Text this number
      from: "+14253740095", // From a valid Twilio number
    };
    console.log(object);
    client.messages.create(object, function (err, message) {
      if (err) {
        return Promise.reject(err);
      }
      console.log(message.sid);
    });
  }

  async deleteUser(user, userId) {
    let t = await Transporter.findById(user._id);
    if (t.banned) {
      return { status: 403, message: "Your account has been suspended" };
    }
    return Transporter.deleteById(userId);
  }

  async addIdenfyScanRef(user, data) {
    const { transporter, idenfyScanRef } = data;
    const response = await Transporter.findByIdAndUpdate(
      transporter,
      { idenfyScanRef },
      { new: true, runValidators: true }
    );
    return { status: 200, message: response };
  }

  transporterRecord = async (user) => {
    const transportersPendingOrPaidStatus =
      await Order.transportersPendingOrPaidStatus();
    return { status: 200, data: transportersPendingOrPaidStatus };
  };
}

var exports = (module.exports = new TransportersController());
