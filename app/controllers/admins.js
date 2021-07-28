const jwt = require("jsonwebtoken");
const Admin = include("models/admin");
const User = include("models/user");
const Transporter = include("models/transporter");
const Vehicle = include("models/vehicle");
const Order = include("models/order");
const Zone = include("models/zone");
const Rank = include("models/rank");
const Station = include("models/station");
const GuardComponent = require('../components/guards');
const Q = require("q");
const md5 = require("md5");
var fs = require("fs");

class AdminsController {
  constructor() {
    this.authComponent = GuardComponent;
  }

  async addRank(user, data) {
    let rank = new Rank(data);
    await rank.save();
    return Transporter.forceUpdate(rank._id);
  }

  async importZones() {
    let fileData = await fs.readFileSync("files/123.json");

    let object = JSON.parse(fileData.toString());
    let array = object.features;
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      let zoneObject = {};
      zoneObject.polygon = element.geometry;
      let properties = element.properties;
      zoneObject.zoneType = properties.DGURBA_CLA;
      switch (properties.DGURBA_CLA) {
        case 1:
          continue;
          break;
        case 2:
          zoneObject.name = "Small Towns and Suburbs etc";
          zoneObject.zoneName = "B";
          zoneObject.priceFactor = 1.6;
          break;
        case 3:
          zoneObject.name = "Rural Areas, Thinly populated areas";
          zoneObject.zoneName = "C";
          zoneObject.priceFactor = 1.8;
          break;

        default:
          break;
      }
      let zone = new Zone(zoneObject);
      await zone.save();
    }
    return { status: 200 };
  }

  async getAll() {
    const response = await Admin.findAll();
    return { status: 200, data: response };
  }

  async update(user, data) {
    const response = await Admin.updateById(data._id, data);
    return { status: 200, data: response };
  }

  login = async (data) => {
    const { email, password } = data;

    // 1) Check if email and password exist
    if (!email || !password) {
      return { status: 400, message: "Please provide email and password!" };
    }
    // 2) Check if user exists && password is correct
    let user = await Admin.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password, user.password))) {
      return { status: 400, message: "Incorrect email or password" };
    }

    user.password = undefined;
    user.passwordChangedAt = undefined;
    const userObject = this.authComponent.encodeToken(user.toObject());
    return userObject;
  };

  signup = async (data) => {
    if (!data.email || !data.password || !data.name) {
      return { status: 400, message: "Parameter missing" };
    }
    let user = await Admin.findOne({ email: data.email });
    if (user) return { status: 403, message: "Email already exists" };
    user = new Admin(data);
    await user.save();
    user.password = undefined;
    const userObject = this.authComponent.encodeToken(user.toObject());
    return userObject;
  };

  forgotPassword = async (data, res) => {
    try {
      // 1) Get user based on POSTed email
      const user = await Admin.findOne({ email: data.email });
      if (!user) {
        return { status: 400, message: "There is no user with email address." };
      }

      // 2) Generate the random reset token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // 3) Send it to user's email
      let resetURL = `https://frankpwa.hitechprime.io/admin/resetPassword/${resetToken}`;
      let message = `Forgot your password? Submit a request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

      await Q.Promise((resolve, reject, notify) => {
        res.mailer.send(
          "password",
          {
            from: "support@hitechsolution.io",
            to: data.email || "shakir.byco@gmail.com",
            subject: "Your password reset token (valid for 10 min)",
            context: {
              otherProperty: message,
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

            resolve({ status: 200 });
          }
        );
      });

      return { status: 200, message: "Token sent to email!" };
    } catch (error) {
      console.log(error);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return {
        status: 500,
        message: "There was an error sending the email. Try again later!",
      };
    }
  };

  resetPassword = async (data, token) => {
    try {
      // 1) Get user based on the token
      const user = await Admin.findHashedToken(token);
      // 2) If token has not expired, and there is user, set the new password
      if (!user) {
        return { status: 400, message: "Token is invalid or has expired" };
      }

      user.password = data.password;
      user.passwordConfirm = data.passwordConfirm;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return { status: 201, message: "Password reset successfully, please login" };
    } catch (error) {
      return { status: 500, message: "Some thing went wrong" };
    }
  };

  async dashboard(user) {
    // Users
    const totalUsersCount = await User.getCount();
    const monthlyUsersCount = await User.getMonthlyCount();
    const weeklyUsersCount = await User.getWeeklyCount();
    const currentUsersCount = await User.getCountCurrentDate();

    // Orders
    const totalOrdersCount = await Order.getCount();
    const monthlyOrdersCount = await Order.getMonthlyCount();
    const weeklyOrdersCount = await Order.getWeeklyCount();
    const currentOrdersCount = await Order.getCountCurrentDate();

    // Pending Orders
    const totalPendingOrdersCount = await Order.getPendingCount();
    const monthlyPendingOrdersCount = await Order.getPendingMonthlyCount();
    const weeklyPendingOrdersCount = await Order.getPendingWeeklyCount();
    const currentPendingOrdersCount = await Order.getPendingCountCurrentDate();

    // Pending In progress
    const totalInprogressOrdersCount = await Order.getInprogressCount();
    const monthlyInprogressOrdersCount =
      await Order.getInprogressMonthlyCount();
    const weeklyInprogressOrdersCount = await Order.getInprogressWeeklyCount();
    const currentInprogressOrdersCount =
      await Order.getInprogressCountCurrentDate();

    // Pending Delivered
    const totalDeliveredOrdersCount = await Order.getDeliveredCount();
    const monthlyDeliveredOrdersCount = await Order.getDeliveredMonthlyCount();
    const weeklyDeliveredOrdersCount = await Order.getDeliveredWeeklyCount();
    const currentDeliveredOrdersCount =
      await Order.getDeliveredCountCurrentDate();

    // transporters
    const totalTransportersCount = await Transporter.getCount();
    const monthlyTransportersCount = await Transporter.getMonthlyCount();
    const weeklyTransportersCount = await Transporter.getWeeklyCount();
    const currentTransportersCount = await Transporter.getCountCurrentDate();

    // Vehicles
    const totalVehiclesCount = await Vehicle.getCount();
    const monthlyVehiclesCount = await Vehicle.getMonthlyCount();
    const weeklyVehiclesCount = await Vehicle.getWeeklyCount();
    const currentVehiclesCount = await Vehicle.getCountCurrentDate();
    // const newTransporters = await Transporter.getNewCount();
    // const newUsers = await User.getNewCount();
    // const orders = await Order.getCount();
    // const pending = await Order.getPendingCount();
    // const accepted = await Order.getInprogressCount();
    // const delivered = await Order.getDeliveredCount();
    const topUsers = await User.topUsers();
    const topTransporters = await Transporter.topTransporters();
    const recentOrders = await Order.recentOrders();
    // const newVehicles = await Vehicle.getNewCount();

    return {
      status: 200,
      data: {
        users: {
          totalCount: totalUsersCount,
          monthlyCount: monthlyUsersCount,
          weeklyCount: weeklyUsersCount,
          currentCount: currentUsersCount,
        },

        orders: {
          totalCount: totalOrdersCount,
          monthlyCount: monthlyOrdersCount,
          weeklyCount: weeklyOrdersCount,
          currentCount: currentOrdersCount,
        },

        pendingOrders: {
          totalCount: totalPendingOrdersCount,
          monthlyCount: monthlyPendingOrdersCount,
          weeklyCount: weeklyPendingOrdersCount,
          currentCount: currentPendingOrdersCount,
        },

        progressOrders: {
          totalCount: totalInprogressOrdersCount,
          monthlyCount: monthlyInprogressOrdersCount,
          weeklyCount: weeklyInprogressOrdersCount,
          currentCount: currentInprogressOrdersCount,
        },

        deliveredOrders: {
          totalCount: totalDeliveredOrdersCount,
          monthlyCount: monthlyDeliveredOrdersCount,
          weeklyCount: weeklyDeliveredOrdersCount,
          currentCount: currentDeliveredOrdersCount,
        },

        transporters: {
          totalCount: totalTransportersCount,
          monthlyCount: monthlyTransportersCount,
          weeklyCount: weeklyTransportersCount,
          currentCount: currentTransportersCount,
        },

        vehicles: {
          totalCount: totalVehiclesCount,
          monthlyCount: monthlyVehiclesCount,
          weeklyCount: weeklyVehiclesCount,
          currentCount: currentVehiclesCount,
        },

        // transporters,
        // orders,
        // pending,
        // accepted,
        // delivered,
        // newTransporters,
        // newUsers,
        // newVehicles,
        topUsers,
        topTransporters,
        recentOrders,
      },
    };
  }

  async currentUpdates(user) {
    // const users = await User.getCount();
    const newUsers = await User.getCountCurrentDate();
    // const transporters = await Transporter.getCount();
    const newTransporters = await Transporter.getCountCurrentDate();
    //  const newTransporters = await Transporter.getNewCount();
    //  const newUsers = await User.getNewCount();
    const orders = await Order.getCount();
    const newOrders = await Order.getCountCurrentDate();
    //  const pending = await Order.getPendingCount();
    const newPending = await Order.getPendingCountCurrentDate();
    //  const accepted = await Order.getInprogressCount();
    const newAccepted = await Order.getInprogressCountCurrentDate();
    //  const delivered = await Order.getDeliveredCount();
    const newDelivered = await Order.getDeliveredCountCurrentDate();
    // need to be configure
    const topUsers = await User.topUsers();
    const topTransporters = await Transporter.topTransporters();
    const recentOrders = await Order.recentOrders();

    //  const vehicles = await Vehicle.getNewCount();
    const newVehicles = await Vehicle.getCountCurrentDate();

    return {
      status: 200,
      data: {
        orders,
        newUsers,
        newOrders,
        newPending,
        newAccepted,
        newDelivered,
        newTransporters,
        newVehicles,
        topUsers,
        topTransporters,
        recentOrders,
      },
    };
  }

  async stats(user, params) {
    const newTransporters = await Transporter.getNewCountBetweenDates(
      params.start,
      params.end
    );
    const newUsers = await User.getNewCountBetweenDates(
      params.start,
      params.end
    );
    const orders = await Order.getNewCountBetweenDates(
      params.start,
      params.end
    );

    return {
      status: 200,
      data: {
        orders,
        newTransporters,
        newUsers,
      },
    };
  }

  async currentCount(Model) {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    let yyyy = today.getFullYear();
    return await Model.count({
      createdAt: { $gte: new Date(yyyy + "-" + mm + "-" + dd) },
    }).exec();
  }
}

var exports = (module.exports = new AdminsController());
