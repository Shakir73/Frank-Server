const User = include("models/user");
const Order = include("models/order");
const Store = include("models/store");
const Transporter = include("models/transporter");
const GuardComponent = require('../components/guards');
const md5 = require("md5");
const Q = require("q");
var transporterController = include("controllers/transporters");
var _ = require("lodash");
var randomstring = require("randomstring");
const order = require("../models/order");

var accountSid = "AC23fffd5d1c827dafb06dd727d2eedb7d"; // Your Account SID from www.twilio.com/console
var authToken = "6e62bb8a2c69afef5a1b501318def7f5"; // Your Auth Token from www.twilio.com/console
const client = require("twilio")(accountSid, authToken);

class UsersController {
  constructor() {
    this.authComponent = GuardComponent;
  }

  async login(data) {
    let mobile = data.mobile;
    if (mobile.startsWith("+")) {
      data.mobile = mobile.substring(1, mobile.length);
    }
    if (!data.mobile || !data.password) {
      return { status: 400, message: "Parameters missing" };
    }
    data.password = md5(data.password);
    const user = await User.login(data);
    if (!user) return { status: 401, message: "Invalid Credentials" };

    const userObject = await this.authComponent.encodeToken(user.toObject());
    return { status: 200, data: userObject };
  }

  async signup(res, data) {
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
    data.emailCode = randomstring.generate({ length: 4, charset: "numeric" });
    data.smsCode = randomstring.generate({ length: 4, charset: "numeric" });
    data.password = md5(data.password);

    var userObject = new User(data);
    await userObject.save();
    this.sendSMS({
      mobile: data.mobile,
      message: "Your Frank Customer App verification code is: " + data.smsCode,
    });
    await transporterController.createTransporter(data);
    let newUser = await this.authComponent.encodeToken(userObject.toObject());
    return Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "verification",
        {
          from: "support@hitechsolution.io",
          to: data.email,
          subject: "Frank OTP Verification",
          context: {
            otherProperty:
              "Your Frank Email verification code is " + data.emailCode,
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

          resolve({ status: 200, data: newUser });
        }
      );
    });
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
    console.log("user verify", _user, data);
    let user =
      _user != null
        ? await User.findById(_user._id)
        : await User.findByMobile(data.mobile);
    if (!user) return { status: 403, message: "Invalid mobile number" };
    let userObject = await User.verify(user._id, data);
    if (userObject) {
      console.log("success");
      userObject = await User.updateUser(user._id, {
        isVerified: true,
        active: true,
      });
      let transporter = await Transporter.findByMobile(data.mobile);
      if (transporter) {
        await Transporter.updateTransporter(transporter._id, {
          isVerified: true,
        });
      }

      return { status: 200, data: userObject };
    }
    console.log("failure");
    return { status: 403, message: "Invalid verification code" };
  }

  async forgotPassword(res, data) {
    const user = await User.findByMobile(data.mobile);
    // console.log(user);
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
    await this.sendSMS({
      mobile: user.mobile,
      message: "Your Frank Customer App Password reset code is " + code,
    });
    return {
      status: 200,
      data: { message: "Recovery code sent to your number" },
    };
  }

  async loginMobile(data) {
    let mobile = data.mobile;
    if (mobile.startsWith("+")) {
      data.mobile = mobile.substring(1, mobile.length);
    }
    console.log(data.mobile);
    const userObject = await User.findByMobile(data.mobile);
    if (!userObject) {
      return {
        status: 401,
        message: "Invalid mobile number",
      };
    }
    userObject.smsCode = randomstring.generate({
      length: 4,
      charset: "numeric",
    });
    await userObject.save();
    // let newUser = await this.authComponent.encodeToken(userObject.toObject());
    this.sendSMS({
      mobile: data.mobile,
      message:
        "Your Frank Customer App verification code is: " + userObject.smsCode,
    });

    return {
      status: 200,
      message: "A verification SMS has been sent to your mobile number",
      data: {
        twoFactorLogin: userObject.twoFactorLogin,
        isVerified: userObject.isVerified,
      },
    };
  }

  async verifyLogin(data) {
    console.log("user login verify", data);
    let mobile = data.mobile;
    if (mobile.startsWith("+")) {
      data.mobile = mobile.substring(1, mobile.length);
    }
    const user = await User.verifyLogin(data);
    if (user) {
      const updatedObject = await User.updateUser(user._id, {
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

  async authenticateWithToken(data) {
    if (!data.token) {
      return { status: 401, message: "Unauthorized user" };
    }
    const user = await User.findByToken(data.token);
    if (user) {
      const updatedObject = await User.updateUser(user._id, {
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
    return { status: 401, message: "Unauthorized user" };
  }

  async changeEmail(user, data) {
    let userObject = await User.findById(user._id);
    if (!userObject) {
      return { status: 401, message: "Invalid User" };
    }
    const updatedUser = await User.updateUser(user._id, {
      email: data.email,
    });
    return { status: 200, data: updatedUser };
  }

  async resendCode(res, user, data) {
    const userObject = await User.findByMobile(data.mobile);
    await this.sendSMS({
      mobile: userObject.mobile,
      message:
        "Your Frank Customer App verification code is: " + userObject.smsCode,
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
          subject: "Frank Verification",
          context: {
            otherProperty:
              "Your Frank Customer App Email verification code is " +
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

  async verifyRecoveryCode(data) {
    console.log(data);
    let user = await User.findByMobile(data.mobile);
    if (!user) {
      return {
        status: 400,
        message: "Invalid number",
      };
    }
    if (data.recoveryCode == user.recoveryCode) {
      return {
        status: 200,
        data: user,
      };
    } else {
      return {
        status: 403,
        message: "Invalid verification code",
      };
    }
  }

  async updatePassword(data) {
    let existingUser = await User.findByMobile(data.mobile);
    if (!existingUser) {
      return {
        status: 403,
        data: { message: "Invalid number" },
      };
    }
    console.log(data);
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
    let userObject = await User.findByIdSelectPassword(user._id);
    if (md5(data.oldPassword) === userObject.password) {
      const updatedUser = await User.updateUser(user._id, {
        password: md5(data.newPassword),
      });
      return { status: 200, data: updatedUser };
    }
    return { status: 401, message: "Invalid Password" };
  }

  async update(user, data) {
    const updatedUser = await User.updateUser(user._id, data);
    return { status: 200, data: updatedUser };
  }

  async search(user, text) {
    return User.search(text);
  }

  async getUserByStore(user, storeId) {
    const users = await User.find({ store: storeId || user._id });
    // let users = await User.findAll();
    return { status: 200, count: users.length, data: users };
  }

  async getUserByType(user, type) {
    let users = await User.getUserByType(type);
    return { status: 200, count: users.length, data: users };
  }

  async getCustomersByStore(user, storeId) {
    let users = await User.find().where("store").in(storeId).exec();
    if (users && users.length > 0) {
      return { status: 200, count: users.length, data: users };
    }
    return { status: 403, data: "Not found" };
  }

  async getMyTransporters(user) {
    const orders = await Order.findCompletedUserRequests(user._id, "delivered");
    console.log(orders);
    const transporters = await Transporter.findByIds(orders);
    return { status: 200, data: transporters };
  }

  async getAll(user) {
    const users = await User.findAll();
    return { status: 200, count: users.length, data: users };
  }

  async getUserProfile(userId) {
    let user = await User.findById(userId);
    if (user) {
      // let store = await Store.find().where('_id').in(user.store).exec();
      // let store = await Order.find().where('store').in(userId).exec();
      let order = await Order.find({ user: { _id: userId } });
      let storeIds = [];
      for (let i = 0; i < order.length; i++) {
        const element = order[i];
        storeIds.push(element.store);
      }
      const store = await Store.find({ _id: { $in: storeIds } });
      // console.log(storeIds);
      let orders = await Order.count().where("user").in(userId).exec();
      user.totalOrders = orders;
      return { status: 200, data: { customer: user, store: store } };
    }
  }

  async getMyProfile(userId) {
    let user = await User.findById(userId);
    if (user) {
      return { status: 200, data: user };
    }
    let transporter = await Transporter.findById(userId);
    if (transporter) {
      return { status: 200, data: transporter };
    }
    return { status: 403, data: "Not found" };
  }

  async deleteUser(userId) {
    return User.deleteById(userId);
  }

  async banUser(user, data) {
    return User.updateUser(data._id, { banned: data.banned });
  }

  async getStats(user, data) {
    const all = await Order.getCountBetweenDatesByUser(user._id, {
      ...data,
    });
    const pending = await Order.getCountBetweenDatesByUser(user._id, {
      ...data,
      status: "pending",
    });
    const inprogress = await Order.getCountBetweenDatesByUser(user._id, {
      ...data,
      status: "accepted",
    });
    const delivered = await Order.getCountBetweenDatesByUser(user._id, {
      ...data,
      status: "delivered",
    });
    const cancelled = await Order.getCountBetweenDatesByUser(user._id, {
      ...data,
      status: "cancelled",
    });

    const allTimeRecord = await Order.countByUserAndStatus(user._id, "pending");

    return {
      status: 200,
      data: { all, pending, inprogress, delivered, cancelled, allTimeRecord },
    };
  }

  async filter(user, data) {
    let result = [];
    if (data.itemType) {
      let orders = await Order.findByCommodityId(data.itemType);
      console.log(orders);
      if (orders.length > 0) {
        let ids = _.map(orders, "user");
        result = await User.findByIds(ids);
      }
    }

    return { status: 200, data: result };
  }

  async getRecentOrders(user) {}

  sendSMS(data) {
    var object = {
      body: data.message,
      to: "+" + data.mobile, // Text this number
      from: "+14253740095", // From a valid Twilio number
    };
    console.log(object);
    client.messages.create(object, function (err, message) {
      if (err) {
        console.log(err);
        return Promise.reject(err);
      }
      console.log(message.sid);
    });
  }
}
var exports = (module.exports = new UsersController());
