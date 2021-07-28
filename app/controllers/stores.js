const Store = include("models/store");
const Order = include("models/order");
const Policy = include("models/policy");
const User = include("models/user");
const Platform = require("../models/platform");
const Warehouse = include("models/warehouse");
const StoreUser = require("../models/StoreUser");
const Role = require("../models/Role");
const Transporter = include("models/transporter");
const GuardComponent = require('../components/guards');
const axios = require("axios");
const md5 = require("md5");
const Q = require("q");
var transporterController = include("controllers/transporters");
let _ = require("lodash");
let randomstring = require("randomstring");

var accountSid = "AC23fffd5d1c827dafb06dd727d2eedb7d"; // Your Account SID from www.twilio.com/console
var authToken = "6e62bb8a2c69afef5a1b501318def7f5"; // Your Auth Token from www.twilio.com/console
const client = require("twilio")(accountSid, authToken);

class UsersController {
  constructor() {
    this.guardComponent = GuardComponent;
  }

  async login(data) {
    // let mobile = data.mobile;
    // if (mobile.startsWith("+")) {
    //   data.mobile = mobile.substring(1, mobile.length);
    // }
    if (!data.email || !data.password) {
      return { status: 400, message: "Parameters missing" };
    }
    data.password = md5(data.password);
    const store = await Store.findByEmailAndPassword(data);
    if (!store) return { status: 401, message: "Invalid Credentials" };

    const userObject = await this.guardComponent.encodeToken(store.toObject());
    return { status: 200, data: userObject };
  }

  async signup(res, data) {
    if (!data.email || !data.uniqueID || !data.name || !data.storeURL) {
      return { status: 400, message: "Parameters missing" };
    }

    let mobile = data.mobile;
    if (mobile.startsWith("+")) {
      data.mobile = mobile.substring(1, mobile.length);
    }
    const store = await Store.findByEmailOrMobile(data);
    if (store) {
      // var params = { ...data };
      // delete params.password;
      // const updatedUser = await Store.updateUser(store._id, params);
      return { status: 400, message: "You are already registered" };
    }
    data.emailCode = "1111"; // randomstring.generate({ length: 4, charset: "numeric" });
    data.smsCode = "1111"; //randomstring.generate({ length: 4, charset: "numeric" });
    data.password = md5(data.password || "");
    if (data.location1) {
      data.location1 = {
        type: "Point",
        coordinates: [data.location1.longitude, data.location1.latitude],
      };
    }
    if (data.location2) {
      data.location2 = {
        type: "Point",
        coordinates: [data.location2.longitude, data.location2.latitude],
      };
    }
    if (data.location3) {
      data.location3 = {
        type: "Point",
        coordinates: [data.location3.longitude, data.location3.latitude],
      };
    }

    let role = await Role.findOne({
      $or: [
        { name: "admin" },
        { _id: "60d454de0119c0398bbe2d42" || data?.role },
      ],
    });

    if (!role) return { status: 403, message: "Admin role  not exists" };

    let storeUser = {
      firstName: data?.firstName,
      lastName: data?.lastName,
      countryCode: data?.countryCode,
      mobile: data?.mobile,
      email: data?.email,
      password: data?.password,
      passwordConfirm: data?.password,
      role: role?._id || data?.role,
    };

    let findUser = await StoreUser.findOne({
      $or: [
        { email: storeUser?.email || data?.email },
        { mobile: storeUser?.mobile || data?.mobile },
      ],
    });
    if (findUser)
      return { status: 400, message: "Email or mobile already exists" };
    // return { status: 200, data: 'succeed' };
    let userStore = await StoreUser.create(storeUser);

    data.emailAddresses = userStore._id;
    let userObject = await Store.create(data);
    // await userObject.save();
    // this.sendSMS({
    //   mobile: data.mobile,
    //   message: "Your Frank verification code is: " + data.smsCode,
    // });

    let newUser = await this.guardComponent.encodeToken(userObject.toObject());
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
    const store = await Store.findByEmailOrMobile(data);
    if (store) return { status: 403, message: "Store already exists" };

    data.password = md5(data.password);
    // data.isVerified = true;
    let role = await Role.findOne({
      $or: [
        { name: "admin" },
        { _id: "60d454de0119c0398bbe2d42" || data?.role },
      ],
    });

    if (!role) return { status: 403, message: "Admin role  not exists" };

    let storeUser = {
      firstName: data?.firstName,
      lastName: data?.lastName,
      countryCode: data?.countryCode,
      mobile: data?.mobile,
      email: data?.email,
      password: data?.password,
      passwordConfirm: data?.password,
      role: role?._id || data?.role,
    };

    let findUser = await StoreUser.findOne({
      $or: [
        { email: storeUser?.email || data?.email },
        { mobile: storeUser?.mobile || data?.mobile },
      ],
    });
    if (findUser)
      return { status: 400, message: "Email or mobile already exists" };
    // return { status: 200, data: 'succeed' };
    let userStore = await StoreUser.create(storeUser);
    data.emailAddresses = userStore._id;

    let userObject = await Store.create(data);
    // let userObject = new Store(data);
    // await userObject.save();

    return { status: 200, data: userObject };
  }

  async verify(_user, data) {
    console.log("store verify", _user, data);
    let store =
      _user != null
        ? await Store.findById(_user._id)
        : await Store.findByMobile(data.mobile);
    if (!store) return { status: 403, message: "Invalid mobile number" };
    let userObject = await Store.verify(store._id, data);
    if (userObject) {
      console.log("success");
      userObject = await Store.updateUser(store._id, {
        isVerified: true,
        active: true,
      });

      let newUser = await this.guardComponent.encodeToken(userObject.toObject());
      return { status: 200, data: newUser };
    }
    console.log("failure");
    return { status: 403, message: "Invalid verification code" };
  }

  async forgotPassword(res, data) {
    // const store = await Store.findByMobile(data.mobile);
    const store = await Store.findByEmail(data.email);
    // console.log(store);
    if (!store) {
      // res.send({headerStatus: 200, status: 401, message: 'There was an error sending email, please try again'});
      return Promise.reject({
        headerStatus: 401,
        status: 401,
        message: "No store found on this number",
      });
    }
    var code = randomstring.generate(8);
    store.recoveryCode = code;
    console.log(code);
    await store.save();
    await this.sendSMS({
      mobile: store.mobile,
      message: "Your Frank Password reset code is " + code,
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
    const userObject = await Store.findByMobile(data.mobile);
    if (!userObject) {
      return {
        status: 401,
        message: "Invalid mobile number",
      };
    }
    // userObject.smsCode = randomstring.generate({
    //   length: 4,
    //   charset: "numeric",
    // });
    userObject.smsCode = "1111";
    await userObject.save();
    // let newUser = await this.guardComponent.encodeToken(userObject.toObject());
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
    console.log("store login verify", data);
    let mobile = data.mobile;
    if (mobile.startsWith("+")) {
      data.mobile = mobile.substring(1, mobile.length);
    }
    const store = await Store.verifyLogin(data);
    if (store) {
      const updatedObject = await Store.updateUser(store._id, {
        isVerified: true,
      });
      const userObject = await this.guardComponent.encodeToken(
        updatedObject.toObject()
      );
      return {
        status: 200,
        data: userObject,
      };
    }
    return { status: 403, message: "Invalid verification code" };
  }

  async changeEmail(store, data) {
    let userObject = await Store.findById(store._id);
    if (!userObject) {
      return { status: 401, message: "Invalid Store" };
    }
    const updatedUser = await Store.updateUser(store._id, {
      email: data.email,
    });
    return { status: 200, data: updatedUser };
  }

  async resendCode(res, store, data) {
    const userObject = await Store.findByMobile(data.mobile);
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
          subject: "Frank OTP Verification",
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
    let store = await Store.findByMobile(data.mobile);
    if (!store) {
      return {
        status: 400,
        message: "Invalid number",
      };
    }
    if (data.recoveryCode == store.recoveryCode) {
      return {
        status: 200,
        data: store,
      };
    } else {
      return {
        status: 403,
        message: "Invalid verification code",
      };
    }
  }

  async updatePassword(data) {
    let existingUser = await Store.findByMobile(data.mobile);
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

  async changePassword(store, data) {
    let userObject = await Store.findByIdSelectPassword(store._id);
    console.log(userObject);
    if (!userObject) {
      return { status: 403, message: "Incorrect current password" };
    }
    if (md5(data.oldPassword) === userObject.password || !userObject.password) {
      const updatedUser = await Store.updateUser(store._id, {
        password: md5(data.newPassword),
      });
      return { status: 200, data: updatedUser };
    }
    return { status: 401, message: "Invalid Password" };
  }

  async resendVerification(store, data) {
    let storeObject = await Store.findById(store._id);

    return { status: 200, data: storeObject };
  }

  async update(store, data) {
    if (data.location1) {
      data.location1 = {
        type: "Point",
        coordinates: [data.location1.longitude, data.location1.latitude],
      };
    }
    if (data.location2) {
      data.location2 = {
        type: "Point",
        coordinates: [data.location2.longitude, data.location2.latitude],
      };
    }
    if (data.location3) {
      data.location3 = {
        type: "Point",
        coordinates: [data.location3.longitude, data.location3.latitude],
      };
    }
    if (data.password) {
      data.password = md5(data.password);
    }

    const updatedUser = await Store.updateUser(store._id, data);
    return { status: 200, data: updatedUser };
  }

  async activate(res, user, data) {
    if (
      !data.storeId ||
      !data.activeLog.userId ||
      !data.policies.policyId ||
      !data.policies.startDate ||
      !data.policies.endDate
    ) {
      return { status: 422, message: "Parameter missing" };
    }

    let activeLog = {
      userId: data.activeLog.userId,
      active: data.active,
    };

    let policies = {
      policyId: data.policies.policyId,
      startDate: data.policies.startDate,
      endDate: data.policies.endDate,
    };

    const updatedStore = await Store.findOneAndUpdate(
      { _id: data.storeId },
      { $addToSet: { activeLog, policies }, $set: { active: data.active } },
      { new: true }
    );

    return Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "store-active",
        {
          from: "support@hitechsolution.io",
          to: updatedStore.email,
          subject: "Frank Your store has been activated",
          context: {
            otherProperty: "Your Frank store has been activated successfully",
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

          resolve({ status: 200, data: updatedStore });
        }
      );
    });
    return { status: 200, data: updatedStore };
  }

  async deActive(res, user, data) {
    if (data.active !== false) {
      return { status: 400, message: "Active must be false" };
    }
    let storeId = await Store.findOne({ _id: data.store });
    if (!storeId) return { status: 400, message: "Store is not exists!" };
    if (storeId.active === false)
      return { status: 400, message: "Store is already de-activated" };

    const updatedStore = await Store.findOneAndUpdate(
      { _id: data.store },
      {
        $set: { active: false },
        $addToSet: {
          activeLog: {
            userId: data.activeLog.userId,
            active: false,
            reason: data.activeLog.reason,
          },
        },
      },
      { new: true }
    );

    return Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "store-de-active",
        {
          from: "support@hitechsolution.io",
          to: updatedStore.email,
          subject: "Frank Your store has been de-activated",
          context: {
            otherProperty:
              "Your Frank store has been de-activated, please contact Frank Admin",
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

          resolve({ status: 200, data: updatedStore });
        }
      );
    });

    return { status: 200, data: updatedStore };
  }

  async updateContactDetails(store, data) {
    if (!data.contactDetail) {
      return { status: 422, message: "Parameter missing" };
    }
    const updatedUser = await Store.updateUser(store._id, data);
    return { status: 200, data: updatedUser };
  }

  // Sore Users
  async addEmailAddress(store, data) {
    if (!data) {
      return { status: 422, message: "Parameter missing" };
    }
    if (
      !data.firstName ||
      !data.lastName ||
      !data.mobile ||
      !data.language ||
      !data.email ||
      !data.password ||
      !data.passwordConfirm ||
      !data.role
    ) {
      return { status: 422, message: "Parameter missing" };
    }
    data.store = store._id;

    const user =
      (await Store.findOne({ email: data?.email || data?.mobile })) ||
      (await StoreUser.findOne({ email: data?.email || data?.mobile }));
    if (user) return { status: 401, message: "User already exists" };

    const storeUser = await StoreUser.create(data);

    if (!storeUser) return { status: 400, message: "Some thing went wrong" };

    await Store.findOneAndUpdate(
      { _id: data.store },
      { $addToSet: { emailAddresses: storeUser._id } },
      { new: true }
    );
    return { status: 200, data: storeUser };
  }

  getAllStoreUsers = async (store) => {
    const storeUsers = await StoreUser.find();
    return { status: 200, data: storeUsers };
  };

  async search(store, text) {
    return Store.search(text);
  }

  async addWarehouse(user, data) {
    if (!data.name || !data.location) {
      return { status: 400, message: "Bad request" };
    }
    data.location = {
      type: "Point",
      coordinates: [data.location.longitude, data.location.latitude],
    };
    let warehouse = new Warehouse(data);
    warehouse.store = user._id;
    await warehouse.save();
    return { status: 200, data: warehouse };
  }

  async getMyWarehouses(user) {
    let data = await Warehouse.findByStore(user._id);
    return { status: 200, data };
  }

  async getMyWarehouseById(user, id) {
    return { status: 200, data: await Warehouse.findById(id) };
  }

  async deleteWarehouse(user, warehouse) {
    await Warehouse.deleteWarehouse(warehouse, user._id);
    let data = await Warehouse.findByStore(user._id);
    return { status: 200, data };
  }

  async updateWarehouse(user, id, body) {
    // console.log(user);
    // let { name, address, city, country, location } = body;

    // if (!name || !address) {
    //   return { status: 401, message: 'Parameters are missing' };
    // }
    const warehouse = await Warehouse.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    return { status: 200, warehouse };
  }

  async getMyTransporters(store) {
    const orders = await Order.findCompletedUserRequests(
      store._id,
      "delivered"
    );
    console.log(orders);
    const transporters = await Transporter.findByIds(orders);
    return { status: 200, data: transporters };
  }

  async getAll(store) {
    const stores = await Store.findAll();
    return { status: 200, count: stores.length, data: stores };
  }

  async getStoreByUniqueID(uniqueID) {
    let store = await Store.findByUniqueID(uniqueID);
    if (!store) {
      return { status: 404, message: "No store found" };
    }
    return { status: 200, data: store };
  }

  async getMyProfile(userId) {
    let store = await Store.findById(userId);
    if (store) {
      let customers = await User.find({ store: userId });
      console.log(customers);
      // const newOrders = await Order.findByStore(userId, 'new');
      store.totalOrders = await Order.countOrders(userId, "all");
      store.Orders = await Order.findByStore(userId, "all");
      store.customers = [...customers];
      return {
        status: 200,
        data: store,
      };
    }
    // let transporter = await Transporter.findById(userId);
    // if (transporter) {
    //   return { status: 200, data: transporter };
    // }
    return { status: 403, data: "Not found" };
  }

  async deleteStore(id) {
    // return { status: 403, data: "not allowed" };
    // await Store.deleteById(id);
    await Store.findByIdAndDelete(id);
    return { status: 200, message: "Store deleted successfully!" };
  }

  async deleteAccount(store) {
    let accessDate = new Date();
    accessDate.setMonth(accessDate.getDate() + 1);
    let storeObject = await Store.updateUser(store._id, {
      deleted: true,
      accessibleTill: accessDate,
    });
    return { status: 200, data: storeObject };
  }

  async banUser(store, data) {
    if (!data.storeId) {
      return { status: 422, message: "Parameter missing" };
    }

    let banned = { banned: data.banned };
    let banLog = {
      userId: data.banLog.userId,
      dateTime: new Date(),
      reason: data.banLog.reason,
    };

    let bannedAndBanLog = { ...banned, banLog };

    // console.log(bannedAndBanLog);
    const updatedStore = await Store.findByIdAndUpdate(
      data.storeId,
      bannedAndBanLog,
      {
        runValidators: true,
        new: true,
      }
    );

    // console.log(bannedAndBanLog);
    return { status: 200, data: updatedStore };

    // return Store.updateUser(data.store, { banned: data.banned });
  }

  async getStats(store, data) {
    const all = await Order.getCountBetweenDatesByUser(store._id, {
      ...data,
    });
    const pending = await Order.getCountBetweenDatesByUser(store._id, {
      ...data,
      status: "pending",
    });
    const inprogress = await Order.getCountBetweenDatesByUser(store._id, {
      ...data,
      status: "accepted",
    });
    const delivered = await Order.getCountBetweenDatesByUser(store._id, {
      ...data,
      status: "delivered",
    });
    const cancelled = await Order.getCountBetweenDatesByUser(store._id, {
      ...data,
      status: "cancelled",
    });

    const allTimeRecord = await Order.countByUserAndStatus(
      store._id,
      "pending"
    );

    return {
      status: 200,
      data: { all, pending, inprogress, delivered, cancelled, allTimeRecord },
    };
  }

  async filter(store, data) {
    let result = [];
    if (data.itemType) {
      let orders = await Order.findByCommodityId(data.itemType);
      console.log(orders);
      if (orders.length > 0) {
        let ids = _.map(orders, "store");
        result = await Store.findByIds(ids);
      }
    }

    return { status: 200, data: result };
  }

  async getRecentOrders(store) {}

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

  async isActive(user, id) {
    const isActive = await Store.findById(id);
    if (
      isActive.active === true &&
      isActive.banned === false &&
      isActive.deleted === false
    ) {
      return { status: 200, data: "Active" };
    }

    return { status: 403, message: "Store is not active" };
  }

  async addFromPrestashop(user, id) {
    const store = await Store.findOne({ _id: id });
    if (!store) {
      return { status: 422, message: "store not found" };
    }
    const config = {
      method: "get",
      url: `http://AAAAAAAAAAAABDULBARIANSARISHAKIR@${store.storeURL}/${store.endPoint}/api/products?output_format=JSON`,
      // url: `http://AAAAAAAAAAAABDULBARIANSARISHAKIR@localhost/book_store/api/products?output_format=JSON`,
    };

    let response = await axios(config);
    let products = response.data.products;

    let allProducts = [];
    for (let i = 1; i <= products.length; i++) {
      const con = {
        method: "get",
        url: `http://AAAAAAAAAAAABDULBARIANSARISHAKIR@${store.storeURL}/${store.endPoint}/api/products/${i}/?output_format=JSON`,
        // url: `http://AAAAAAAAAAAABDULBARIANSARISHAKIR@localhost/book_store/api/products/${i}/?output_format=JSON`,
      };

      let result = await axios(con);
      result = result.data.product;
      allProducts.push(result);
    }
    await Platform.deleteMany();
    let prods = allProducts.map(function (item) {
      return {
        platform: "Prestashop",
        store: store._id,
        productId: item.id,
        name: item.name[0].value,
        dimensions: {
          width: item.width,
          height: item.height,
          depth: item.depth,
          weight: item.weight,
        },
        price: parseFloat(item.price),
      };
    });
    let p = await Platform.create(prods);
    return { status: 200, data: p };

    // return { status: 200, data: allProducts };
  }

  async getPrestashopProducts(store, id) {
    const products = await Platform.find({ store: id });
    return { status: 200, count: products.length, products };
  }

  async searchOrders(store, data) {
    let res = await Order.searchOrders(data);
    return { status: 200, data: res };
  }

  async storeStatics(user, id) {
    let today = new Date();
    let currentDate = new Date(today.getTime());
    const lastWeek = await Order.detailCount(
      id,
      new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      currentDate
    );
    const lastTwoWeek = await Order.detailCount(
      id,
      new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
      currentDate
    );
    const lastMonth = await Order.detailCount(
      id,
      new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      currentDate
    );

    const summaryLastWeek = await Order.totalCount(
      id,
      new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      currentDate
    );
    const summaryLastTwoWeek = await Order.totalCount(
      id,
      new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
      currentDate
    );
    const summaryLastMonth = await Order.totalCount(
      id,
      new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      currentDate
    );

    return {
      status: 200,
      summary: {
        lastWeek: summaryLastWeek,
        lastTwoWeek: summaryLastTwoWeek,
        lastMonth: summaryLastMonth,
      },
      detail: { lastWeek, lastTwoWeek, lastMonth },
    };
  }

  async ordersByStatus(store, id) {
    let today = new Date();
    let currentDate = new Date(today.getTime());

    const lastWeek = await Order.ordersByStatus(
      id,
      new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      currentDate
    );
    const lastTwoWeek = await Order.ordersByStatus(
      id,
      new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
      currentDate
    );
    const lastMonth = await Order.ordersByStatus(
      id,
      new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      currentDate
    );

    return { status: 200, orders: { lastWeek, lastTwoWeek, lastMonth } };
  }
}
module.exports = new UsersController();
