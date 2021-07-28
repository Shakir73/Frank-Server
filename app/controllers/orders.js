const _ = require("lodash");
const Order = include("models/order");
const Transporter = include("models/transporter");
const Journey = include("models/journey");
const User = include("models/user");
const Admin = include("models/admin");
const Feedback = include("models/feedback");
const Complain = include("models/complain");
const Customer = include("models/customer");
const Rates = include("models/rates");
const Vehicle = include("models/vehicle");
const Schedule = include("models/schedule");
const Finance = include("models/finance");
const Promo = include("models/promo");
const Promotion = include("models/Promotion");
const Commodity = include("models/commodity");
const Category = include("models/category");
const Store = include("models/store");
const ServiceArea = include("models/servicearea");
const Price = include("models/price");
const ModificationLog = include("models/modificationlog");
let notificationsController = include("controllers/notifications");
let customersController = include("controllers/customer");
let ratesController = include("controllers/rates");
var Distance = require("geo-distance");
var UploadServiceComponent = include("components/upload");
var randomstring = require("randomstring");
const Q = require("q");
const csvtojsonV2 = require("csvtojson");
const moment = require("moment");

var accountSid = "AC23fffd5d1c827dafb06dd727d2eedb7d"; // Your Account SID from www.twilio.com/console
var authToken = "6e62bb8a2c69afef5a1b501318def7f5"; // Your Auth Token from www.twilio.com/console
const client = require("twilio")(accountSid, authToken);

class OrderController {
  async getAll() {
    const data = await Order.findAll();
    return { status: 200, count: data.length, data };
  }

  async getNew(user, page) {
    try {
      // user._id = "6026277358f8f5f79faed4f5";
      const serviceAreas = await ServiceArea.findByTransporter(user._id);
      const transporter = await Transporter.findById(user._id);

      let findPromotion = await Promotion.findOne({
        transporters: { $in: user._id },
      }).sort({ createdAt: -1 });
      let today = new Date();
      today = today.getTime();
      let promotionEndDate = findPromotion?.endDate?.getTime();

      let percentage = transporter?.percentage?.percentage;

      let findPromotionDiscount = 0;
      let findPromotionDiscountType = "";
      if (promotionEndDate > today) {
        findPromotionDiscount = findPromotion.discount;
        findPromotionDiscountType = findPromotion.discountType;
      }

      const journeys = transporter?.travelling;
      if (serviceAreas?.length == 0 && journeys?.length == 0) {
        return { status: 200, data: [] };
      }
      let count =
        serviceAreas.length > 0
          ? await Order.countWithinPolygon(serviceAreas)
          : 0;
      const orders =
        serviceAreas.length > 0
          ? await Order.findWithinPolygon(serviceAreas, page)
          : [];
      // let ids = orders.map((id) => id._id);

      // const latestOrder = await Order.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).limit(3);
      // console.log(latestOrder);

      for (let i = 0; i < orders.length; i++) {
        if (findPromotionDiscountType === "amount") {
          // adding promotion amount by abdul bari
          orders[i].rates.total =
            (orders[i].rates.total / 100) * parseInt(percentage) +
            findPromotionDiscount;
        } else if (findPromotionDiscountType === "percentage") {
          let promotionPercentage = (orders[i].rates.total =
            (orders[i].rates.total / 100) * parseInt(findPromotionDiscount));
          orders[i].rates.total =
            (orders[i].rates.total / 100) * parseInt(percentage) +
            promotionPercentage;
        } else {
          orders[i].rates.total =
            (orders[i].rates.total / 100) * parseInt(percentage);
        }
      }
      const orders2 =
        journeys.length > 0 ? await Order.findByJourneys(journeys, page) : [];
      const orders3 = transporter.location
        ? await Order.findByLocation(transporter.location, page)
        : [];
      let final = _.concat(orders, ...orders2);
      // final = _.concat(final, ...orders3);
      return { status: 200, total: count, limit: 50, data: final };
    } catch (error) {
      console.log(error);
    }
  }

  async getNewReqCount(user, page) {
    try {
      const serviceAreas = await ServiceArea.findByTransporter(user._id);
      const transporter = await Transporter.findById(user._id);
      const journeys = transporter.travelling;
      if (serviceAreas.length == 0 && journeys.length == 0) {
        return { status: 200, data: [] };
      }
      let count =
        serviceAreas.length > 0
          ? await Order.countWithinPolygon(serviceAreas)
          : 0;

      return { status: 200, count: count };
    } catch (error) {
      console.log(error);
    }
  }

  async findUnderPolygon(user, data) {
    try {
      const orders = await Order.findWithinPolygon(data.polygon);
      console.log(orders);
      return { status: 200, data: orders };
    } catch (error) {
      console.log(error);
      return { status: 200, data: "failed" };
    }
  }

  async changeLogById(user, data) {
    let changelog = await ModificationLog.findByOrder(data);
    return { status: 200, data: changelog };
  }

  async getById(user, id) {
    let data = await Order.findById(id);
    // let store = await Store.findOne({ _id: data.store });
    // data.store = store;
    // console.log(store);
    if (data.routes.length > 0) {
      for (let index = 0; index < data.routes.length; index++) {
        const element = data.routes[index];
        if (!element.rates) {
          element.rates = data.rates;
          await element.save();
        }
      }
    }
    return { status: 200, data: data };
  }

  async getBySpace(user, id, status) {
    let p = await Transporter.findOne({
      _id: user._id,
    }).populate({ path: "percentage", select: "percentage" });
    p = p?.percentage?.percentage;

    let findPromotion = await Promotion.findOne({
      transporters: { $in: user._id },
    }).sort({ createdAt: -1 });
    let today = new Date();
    today = today.getTime();
    let promotionEndDate = findPromotion.endDate.getTime();

    let findPromotionDiscount = 0;
    let findPromotionDiscountType = "";
    if (promotionEndDate > today) {
      findPromotionDiscount = findPromotion.discount;
      findPromotionDiscountType = findPromotion.discountType;
    }

    let ids = _.map(drivers, "_id");
    let orders = await Order.findBySpace(id, status);
    for (let i = 0; i < orders.length; i++) {
      if (findPromotionDiscountType === "amount") {
        // adding promotion amount by abdul bari
        orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(p) + findPromotionDiscount;
      } else if (findPromotionDiscountType === "percentage") {
        let promotionPercentage = (orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(findPromotionDiscount));
        orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(p) + promotionPercentage;
      } else {
        orders[i].rates.total = (orders[i].rates.total / 100) * parseInt(p);
      }
      // adding promotion amount by abdul bari

      // this code commented ---------- 03-05-2021
      // orders[i].rates.total = (orders[i].rates.total / 100) * p;
    }
    return { status: 200, data: orders };
  }

  async searchByOrderNumber(user, orderNumber) {
    const data = await Order.searchByOrderNumber(orderNumber);
    return { status: 200, data };
  }

  async searchByPlaces(user, data) {
    const response = await Order.findByPlaces(user._id, data);
    return { status: 200, data: response };
  }

  async searchMyOrders(user, data) {
    const vehicles = await Vehicle.findMyVehicle(user._id, data);
    if (vehicles.length > 0) {
      data.vehicles = _.map(vehicles, "_id");
    }
    const drivers = await Transporter.searchMyDrivers(user._id, data);
    if (drivers.length > 0) {
      data.drivers = _.map(drivers, "_id");
    }

    const itemCategories = await Category.search(data.text);

    if (itemCategories.length > 0) {
      let itemIds = _.map(itemCategories, "_id");
      let commodities = await Commodity.findByItemTypes(itemIds);
      data.commodities = _.map(commodities, "_id");
    }

    const response = await Order.findMyOrders(user._id, data);
    return { status: 200, data: response };
  }

  async getByModeOfTransportation(user, data) {
    if (data.filterBy === "transport") {
      const vehicles = await Vehicle.findMyMode(user._id, data);
      if (vehicles.length > 0) {
        data.vehicles = _.map(vehicles, "_id");
      } else {
        return { status: 200, data: [] };
      }
    } else if (data.filterBy === "itemType") {
      let orders = await this.getByItemType(user, { itemType: data.text });
      return { status: 200, data: orders };
    }

    const response = await Order.findMyOrders(user._id, data);
    return { status: 200, data: response };
  }

  async searchDriversOrders(user, data) {
    const drivers = await Transporter.findMyDrivers(user._id);
    let ids = _.map(drivers, "_id");
    data.drivers = ids;
    const response = await Order.findDriversOrders(user._id, data);
    return { status: 200, data: response };
  }

  async getByItemType(user, data) {
    let commodities = await Commodity.findByItemType(data.itemType);
    let cid = _.map(commodities, "_id");
    console.log(cid);
    let orders = await Order.findByCommoditiesAndUser(cid, user._id);
    return { status: 200, data: orders };
  }

  async trackById(id) {
    const data = await Order.trackById(id);
    return { status: 200, data };
  }

  async getMyRequests(user, status, page) {
    const data = await Order.findMyRequests(user._id, status, page);
    let count = await Order.countMyRequests(user._id, status);
    return { status: 200, data, total: count, limit: 50 };
  }

  async getDriversRequests(user, status) {
    const drivers = await Transporter.findMyDrivers(user._id);
    let p = await Transporter.findOne({
      _id: user._id,
    }).populate({ path: "percentage", select: "percentage" });
    p = p?.percentage?.percentage;

    let findPromotion = await Promotion.findOne({
      transporters: { $in: user._id },
    }).sort({ createdAt: -1 });
    let today = new Date();
    today = today.getTime();
    let promotionEndDate = findPromotion.endDate.getTime();

    let findPromotionDiscount = 0;
    let findPromotionDiscountType = "";
    if (promotionEndDate > today) {
      findPromotionDiscount = findPromotion.discount;
      findPromotionDiscountType = findPromotion.discountType;
    }
    let ids = _.map(drivers, "_id");
    const orders = await Order.findByDrivers(status, ids);
    for (let i = 0; i < orders.length; i++) {
      if (findPromotionDiscountType === "amount") {
        // adding promotion amount by abdul bari
        orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(p) + findPromotionDiscount;
      } else if (findPromotionDiscountType === "percentage") {
        let promotionPercentage = (orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(findPromotionDiscount));
        orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(p) + promotionPercentage;
      } else {
        orders[i].rates.total = (orders[i].rates.total / 100) * parseInt(p);
      }
      // adding promotion amount by abdul bari

      // this code commented ---------- 03-05-2021
      // orders[i].rates.total = (orders[i].rates.total / 100) * p;
    }
    return { status: 200, data: orders };
  }

  async getByStore(user, store, status, type, page) {
    const data = await Order.findByStore(store, status, type, page);

    return { status: 200, count: data.length, data };
  }

  async getOrderByStatusAndType(user, status, type) {
    const orders = await Order.getOrderByStatusAndType(status, type);
    return { status: 200, count: orders.length, data: orders };
  }

  async stats(user, storeId) {
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 0);
    const todays = await Order.count({
      store: storeId,
      updatedAt: { $lte: endDate, $gte: startDate },
      status: {
        $nin: [
          "cancelledbyuser",
          "cancelledbytransporter",
          "cancelledbyadmin",
          "cancelledbystore",
          "cancelledByStore",
        ],
      },
    });

    //  startDate.setDate(endDate.getDate() - 7);
    const todaysWeek = await Order.count({
      store: storeId,
      updatedAt: { $gte: startDate.getDate() - 7 },
      status: {
        $nin: [
          "cancelledbyuser",
          "cancelledbytransporter",
          "cancelledbyadmin",
          "cancelledbystore",
          "cancelledByStore",
        ],
      },
    });

    const todaysMonth = await Order.count({
      store: storeId,
      updatedAt: { $gte: startDate.getDate() - 30 },
      status: {
        $nin: [
          "cancelledbyuser",
          "cancelledbytransporter",
          "cancelledbyadmin",
          "cancelledbystore",
          "cancelledByStore",
        ],
      },
    });
    return { status: 200, todays, todaysWeek, todaysMonth };
  }

  async statsByStore(user, store) {
    let endDate = new Date();
    let startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    let params = {
      startDate,
      endDate,
      period: "daily",
    };
    // console.log(store);
    const shippedOrders = await Order.shippedOrderCountsByStore(store, params);
    const returnOrders = await Order.returnOrderCountsByStore(store, params);
    let today = new Date();
    let sevenDays = new Date();

    sevenDays.setDate(today.getDate() - 7);
    const returnThisWeek = await Order.returnCountByStoreAndDate(
      sevenDays,
      today,
      store
    );
    const shippedThisWeek = await Order.shippedCountByStoreAndDate(
      sevenDays,
      today,
      store
    );

    sevenDays.setDate(today.getDate() - 15);
    const returnTwoWeeks = await Order.returnCountByStoreAndDate(
      sevenDays,
      today,
      store
    );
    const shippedTwoWeeks = await Order.shippedCountByStoreAndDate(
      sevenDays,
      today,
      store
    );

    sevenDays.setDate(today.getDate() - 30);
    const returnLastMonth = await Order.returnCountByStoreAndDate(
      sevenDays,
      today,
      store
    );
    const shippedLastMonth = await Order.shippedCountByStoreAndDate(
      sevenDays,
      today,
      store
    );
    return {
      status: 200,
      data: {
        shippedOrders: {
          shippedOrders,
          shippedThisWeek,
          shippedTwoWeeks,
          shippedLastMonth,
        },
        returnOrders: {
          returnOrders,
          returnThisWeek,
          returnTwoWeeks,
          returnLastMonth,
        },
      },
    };
  }

  async getStatsByStore(user, data) {
    if (!data.store || !data.period) {
      return { status: 422, message: "Parameters missing" };
    }
    let store = data.store;
    let endDate = new Date();
    let startDate = new Date();

    startDate.setDate(endDate.getDate() - parseInt(data.period));

    let params = {
      startDate,
      endDate,
      period: "daily",
      isReturnOrder: data.return,
    };
    const returnOrders = await Order.returnOrderCountsByStore(store, params);
    let today = new Date();
    let sevenDays = new Date();
    sevenDays.setDate(today.getDate() - 7);
    const thisWeek = await Order.countByStoreAndDate(
      sevenDays,
      today,
      store,
      data.return
    );
    sevenDays.setDate(today.getDate() - 15);
    const twoWeeks = await Order.countByStoreAndDate(
      sevenDays,
      today,
      store,
      data.return
    );
    sevenDays.setDate(today.getDate() - 30);
    const lastMonth = await Order.countByStoreAndDate(
      sevenDays,
      today,
      store,
      data.return
    );
    return {
      status: 200,
      data: { returnOrders, thisWeek, twoWeeks, lastMonth },
    };
  }

  async getUserRequests(user, status, userId) {
    const orders = await Order.findUserRequests(userId || user._id, status);
    let transporter = await Transporter.findOne({
      _id: userId || user._id,
    }).populate({ path: "percentage", select: "percentage" });
    // transporter = transporter?.percentage?.percentage;
    p = transporter.percentage.percentage;

    let findPromotion = await Promotion.findOne({
      transporters: { $in: userId || user._id },
    }).sort({ createdAt: -1 });
    let today = new Date();
    today = today.getTime();
    let promotionEndDate = findPromotion.endDate.getTime();

    let findPromotionDiscount = 0;
    let findPromotionDiscountType = "";
    if (promotionEndDate > today) {
      findPromotionDiscount = findPromotion.discount;
      findPromotionDiscountType = findPromotion.discountType;
    }

    for (let i = 0; i < orders.length; i++) {
      if (findPromotionDiscountType === "amount") {
        // adding promotion amount by abdul bari
        orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(p) + findPromotionDiscount;
      } else if (findPromotionDiscountType === "percentage") {
        let promotionPercentage = (orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(findPromotionDiscount));
        orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(p) + promotionPercentage;
      } else {
        orders[i].rates.total = (orders[i].rates.total / 100) * parseInt(p);
      }
      // adding promotion amount by abdul bari

      // this code commented ---------- 03-05-2021
      // orders[i].rates.total = (orders[i]?.rates?.total / 100) * transporter;
      // orders[i].rates.total = (orders[i].rates.total / 100) * p;
    }
    return { status: 200, data: orders };
  }

  async getOrdersByDriver(user, driver, status) {
    const orders = await Order.findMyRequests(driver, status);
    let p = await Transporter.findOne({ _id: driver }).populate({
      path: "percentage",
      select: "percentage",
    });

    p = p?.percentage?.percentage;
    // p = p.percentage.percentage;

    let findPromotion = await Promotion.findOne({
      transporters: { $in: driver },
    }).sort({ createdAt: -1 });
    let today = new Date();
    today = today.getTime();
    let promotionEndDate = findPromotion?.endDate.getTime();

    let findPromotionDiscount = 0;
    let findPromotionDiscountType = "";
    if (promotionEndDate > today) {
      findPromotionDiscount = findPromotion.discount;
      findPromotionDiscountType = findPromotion.discountType;
    }

    for (let i = 0; i < orders.length; i++) {
      if (findPromotionDiscountType === "amount") {
        // adding promotion amount by abdul bari
        orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(p) + findPromotionDiscount;
      } else if (findPromotionDiscountType === "percentage") {
        let promotionPercentage = (orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(findPromotionDiscount));
        orders[i].rates.total =
          (orders[i].rates.total / 100) * parseInt(p) + promotionPercentage;
      } else {
        orders[i].rates.total = (orders[i].rates.total / 100) * parseInt(p);
      }
      // adding promotion amount by abdul bari

      // this code commented ---------- 03-05-2021
      // orders[i].rates.total = (orders[i].rates.total / 100) * p;
    }
    return { status: 200, data: orders };
  }

  async getEstimatesOpen(user, data) {
    console.log(data);
    if (
      !data.pickup ||
      !data.dropoff ||
      !data.totalWeight ||
      !data.totalWeight ||
      !data.totalWidth ||
      !data.totalHeight ||
      !data.totalLength ||
      !data.config
    ) {
      return { status: 400, message: "Parameters missing" };
    }
    const point1 = {
      lat: data.pickup.location[1],
      lon: data.pickup.location[0],
    };
    const point2 = {
      lat: data.dropoff.location[1],
      lon: data.dropoff.location[0],
    };
    const distance = Distance.between(point1, point2);
    // console.log(distance);
    // console.log(distance.human_readable());
    // console.log(distance.human_readable().distance);

    const ratesObj = await ratesController.getRatesWithParam({
      type: data.deliveryType,
      distance: distance.human_readable().distance,
      weight: data.totalWeight,
      width: data.totalWidth,
      height: data.totalHeight,
      length: data.totalLength,
      config: data.config,
      priceImpact: data.priceImpact,
      pickup: data.pickup,
      dropoff: data.dropoff,
    });
    const rates = ratesObj.rates;
    if (!rates) {
      const defaultRate = await Rates.findById("5cd3f5c7dee30c0017625596");

      return {
        status: 200,
        data: { rates: defaultRate },
      };
    }

    return { status: 200, data: { rates } };
  }

  async getOrderRates(user, data) {
    // console.log("get rates: ", data);
    if (
      !data.pickup ||
      !data.dropoff ||
      !data.totalWeight ||
      !data.totalWeight ||
      !data.totalWidth ||
      !data.totalHeight ||
      !data.totalLength
    ) {
      return { status: 400, message: "Parameters missing" };
    }
    var promo = undefined;
    if (data.promo) {
      promo = await Promo.applyPromo(user._id, data.promo.toLowerCase());
      if (!promo) {
        return {
          status: 403,
          message:
            "The promo code is not valid, make sure you did not make any typo",
        };
      }
    }
    const point1 = {
      lat: data.pickup.location[1],
      lon: data.pickup.location[0],
    };
    const point2 = {
      lat: data.dropoff.location[1],
      lon: data.dropoff.location[0],
    };
    const distance = Distance.between(point1, point2);
    // console.log(distance);
    // console.log(distance.human_readable());
    // console.log(distance.human_readable().distance);
    let userObj = await User.findById(data.user || user._id);
    let ratesObj = await ratesController.getRatesWithParam({
      type: data.deliveryType,
      distance: distance.human_readable().distance,
      weight: data.totalWeight,
      width: data.totalWidth,
      height: data.totalHeight,
      length: data.totalLength,
      config: {},
      priceImpact: data.priceImpact,
      pickup: data.pickup,
      dropoff: data.dropoff,
    });
    let rates = ratesObj.rates;
    let array = data.commodities;
    if (data.commodities) {
      for (let index = 0; index < array.length; index++) {
        let element = array[index];
        const ratePerItem = await ratesController.getRatesByEachCommodity(
          {
            type: data.deliveryType,
            distance: distance.human_readable().distance,
            weight: element.weight,
            width: element.width,
            height: element.height,
            length: element.length,
            config: {},
            priceImpact: element.priceImpact,
            pickup: data.pickup,
            dropoff: data.dropoff,
          },
          ratesObj.z0,
          ratesObj.z1
        );
        // console.log("per item rate : ", ratePerItem);
        element["rates"] = ratePerItem;
        // console.log("element : ", element);
        array[index] = element;
      }
      console.log(array);
      rates["ratesByItem"] = array;
    }
    if (!rates) {
      const defaultRate = await Rates.findById("5cd3f5c7dee30c0017625596");

      return {
        status: 200,
        data: { rates: defaultRate },
      };
    }
    if (promo) {
      // const promo = await Promo.applyPromo(user._id, data.promo.toLowerCase());
      if (!promo) {
        return {
          status: 403,
          message:
            "The promo code is not valid, make sure you did not make any typo",
        };
      }
      return { status: 200, data: { rates, promo } };
    }
    return { status: 200, data: { rates, items: array } };
  }

  async addEcommerceOrder(user, data, res) {
    // console.log(data);
    if (
      !data.type ||
      // !data.pickup ||
      !data.dropoff ||
      !data.commodities ||
      !data.pickupDate ||
      !data.contact ||
      // !data.totalWeight ||
      // !data.totalWidth ||
      // !data.totalHeight ||
      // !data.totalLength ||
      !data.store
    ) {
      return { status: 400, message: "Parameters missing" };
    }
    const userObj = await Store.findOne({ _id: data.store });
    if (!data.pickup) {
      data.pickup = {
        address: userObj.address1,
        location: userObj.location1.coordinates,
        shortAddress: userObj.address1,
        city: userObj.city,
        country: userObj.country,
      };
    }

    const point1 = {
      lat: data.pickup.location[1],
      lon: data.pickup.location[0],
    };
    const point2 = {
      lat: data.dropoff.location[1],
      lon: data.dropoff.location[0],
    };
    const distance = Distance.between(point1, point2);
    // console.log(distance.human_readable().distance);
    let promo = undefined;
    if (data.promo) {
      // promo = await Promo.applyPromo(user._id, data.promo.toLowerCase());
      promo = await Promo.findById(data.promo);
      if (!promo) {
        return {
          status: 403,
          message:
            "The promo code is not valid, make sure you did not make any typo",
        };
      }
    }

    let getPriceObject = {
      pickup: data.pickup,
      dropoff: data.dropoff,
      items: data.items,
    };
    const price = await Price.getPrice(data.store, getPriceObject);

    const rates = await Rates.create(price);

    let commodities = [];
    for (let index = 0; index < data.commodities.length; index++) {
      const element = data.commodities[index];
      const item = new Commodity(element);
      await item.save();
      commodities.push(item._id);
    }
    data.commodities = commodities;

    let num = await Order.countByToday();
    num = parseInt(num) + 1;
    data.orderNumber = data.orderNumber + "" + _.padStart(num, 4, "0");
    // console.log("order number:", data.orderNumber);
    var existingUser = await User.findByEmail(data.contact.email);
    if (!existingUser) {
      existingUser = new User({
        email: data.contact.email,
        firstName: data.contact.firstName,
        lastName: data.contact.lastName,
        mobile: data.contact.number,
        countryCode: data.contact.countryCode,
        store: data.store,
      });
      await existingUser.save();
    }
    const order = new Order(data);
    order.rates = rates;
    order.user = existingUser._id;
    if (data.preferredTransporter) {
      await notificationsController.sendNotificationToTransporter({
        user: user._id,
        transporter: data.preferredTransporter,
        order: order._id,
        message: "You have received a new request from user",
        type: "assigned",
      });
    }
    await order.save();
    await Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "new-order",
        {
          from: "support@hitechsolution.io",
          to: data.contact.email || "asif@hitechsolution.io",
          subject: "Frank - Your order has been placed",
          context: {
            otherProperty:
              "https://frankpwa.hitechprime.io/requests/track/" +
              order.orderNumber,
          },
        },
        function (err) {
          if (err) {
            // console.log(err);
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
    return { status: 200, data: order };
  }

  async createShipment(user, data, res) {
    console.log(data);
    if (
      !data.type ||
      !data.pickup ||
      !data.dropoff ||
      !data.commodities ||
      !data.pickupDate ||
      !data.contact ||
      !data.totalWeight ||
      !data.totalWidth ||
      !data.totalHeight ||
      !data.totalLength ||
      !data.store
    ) {
      return { status: 400, message: "Parameters missing" };
    }
    data.storeOrderID = Math.random().toString(36).substring(4).toUpperCase();
    const point1 = {
      lat: data.pickup.location[1],
      lon: data.pickup.location[0],
    };
    const point2 = {
      lat: data.dropoff.location[1],
      lon: data.dropoff.location[0],
    };
    const distance = Distance.between(point1, point2);
    // console.log(distance.human_readable().distance);
    let promo = undefined;
    if (data.promo) {
      // promo = await Promo.applyPromo(user._id, data.promo.toLowerCase());
      promo = await Promo.findById(data.promo);
      if (!promo) {
        return {
          status: 403,
          message:
            "The promo code is not valid, make sure you did not make any typo",
        };
      }
    }
    let userObj = await Store.findById(data.store);

    let getPriceObject = {
      pickup: data.pickup,
      dropoff: data.dropoff,
      items: data.items,
    };
    const price = await Price.getPrice(data.store, getPriceObject);

    const rates = await Rates.create(price);

    // let ratesObj = await ratesController.getRatesWithParam({
    //   type: data.deliveryType,
    //   distance: distance.human_readable().distance,
    //   weight: data.totalWeight,
    //   width: data.totalWidth,
    //   height: data.totalHeight,
    //   length: data.totalLength,
    //   config: (userObj || {}).config,
    //   priceImpact: data.priceImpact,
    //   pickup: data.pickup,
    //   dropoff: data.dropoff,
    // });
    // let rates = ratesObj.rates;
    // if (promo) {
    //   let price = rates.price * (1 - promo.discount / 100);
    //   rates.price = price;
    //   await rates.save();
    // }
    // if (!rates) {
    //   rates = await Rates.findById("5cd3f5c7dee30c0017625596");
    //   // return {
    //   //   status: 403,
    //   //   message: "Couldn't find a suitable vehicle for your parcel"
    //   // };
    // }
    //removed for e-commerce order
    /*const card = await Customer.findByUserId(user._id);
    if (card.length === 0) {
      return {
        status: 403,
        message:
          "You must have to first Add Credit Card information in payment option",
      };
    }*/

    let commodities = [];
    for (let index = 0; index < (data.commodities || []).length; index++) {
      const element = data.commodities[index];
      const item = new Commodity(element);
      await item.save();
      commodities.push(item._id);
    }
    data.commodities = commodities;

    let num = await Order.countByToday();
    num = parseInt(num) + 1;
    data.orderNumber = data.orderNumber + "" + _.padStart(num, 4, "0");
    // console.log("order number:", data.orderNumber);
    const order = new Order(data);
    order.rates = rates;
    order.user = user._id;
    if (data.preferredTransporter) {
      await notificationsController.sendNotificationToTransporter({
        user: user._id,
        transporter: data.preferredTransporter,
        order: order._id,
        message: "You have received a new request from user",
        type: "assigned",
      });
    }
    await order.save();
    await Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "new-order",
        {
          from: "support@hitechsolution.io",
          to: "faizan@hitechsolution.io",
          subject: "Frank - Your order has been placed",
          context: {
            otherProperty:
              "https://frankpwa.hitechprime.io/#/requests/track/" +
              order.orderNumber,
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
    return { status: 200, data: order };
  }

  async createBulkShipment(user, data, res) {
    // console.log(data);
    if (!data.csv) {
      return { status: 400, message: "Bad request" };
    }
    let result = await csvtojsonV2().fromString(data.csv);
    let orders = [];
    for (let index = 0; index < result.length; index++) {
      let str = Math.random().toString(36).substring(4);
      let on = randomstring.generate({
        length: 16,
        charset: "numeric",
      });
      const record = result[index];
      if (
        !record.pickup_address ||
        !record.pickup_city ||
        !record.pickup_country ||
        !record.dropoff_address ||
        !record.dropoff_city ||
        !record.dropoff_country ||
        !record.item ||
        !record.length ||
        !record.width ||
        !record.height ||
        !record.weight ||
        !record.delivery_type ||
        !record.quantity ||
        !record.dropoff_longitude ||
        !record.dropoff_latitude ||
        !record.pickup_longitude ||
        !record.pickup_latitude
      ) {
        return { status: 400, message: "Parameters are missing" };
      }
      let getPriceObject = {
        pickup: record.pickup_address,
        dropoff: record.dropoff_address,
        items: [
          {
            item: record.item,
            size: [
              parseFloat(record.length),
              parseFloat(record.width),
              parseFloat(record.height),
              parseFloat(record.weight),
            ],
            service: record.delivery_type,
            store: user._id,
            quantity: parseInt(record.quantity),
          },
        ],
      };
      const price = await Price.getPrice(user._id, getPriceObject);

      const rates = await Rates.create(price);
      // console.log(record);
      let commodity = new Commodity({
        name: record.item,
        quantity: parseInt(record.quantity),
        canReturn: record.returnable == "yes" ? true : false,
        maxReturnDays: record.max_return_days,
        weight: parseFloat(record.weight),
        length: parseFloat(record.length),
        width: parseFloat(record.width),
        height: parseFloat(record.height),
      });
      await commodity.save();
      let obj = {
        type: "delivery",
        pickup: {
          address: record.pickup_address,
          location: [
            parseFloat(record.pickup_longitude),
            parseFloat(record.pickup_latitude),
          ],
          shortAddress: record.pickup_address,
          city: record.pickup_city,
          country: record.pickup_country,
        },
        dropoff: {
          address: record.dropoff_address,
          location: [
            parseFloat(record.dropoff_longitude),
            parseFloat(record.dropoff_latitude),
          ],
          shortAddress: record.dropoff_address,
          city: record.dropoff_city,
          country: record.dropoff_country,
        },
        returnAddress: {
          address: record.return_address,
          location: [
            parseFloat(record.return_longitude),
            parseFloat(record.return_latitude),
          ],
          shortAddress: record.return_address,
          city: record.return_city,
          country: record.return_country,
        },
        commodities: [commodity._id],
        pickupDate: record.pickup_date,
        contact: {
          name: record.customer_name,
          firstName: record.customer_name,
          lastName: record.customer_name,
          number: record.customer_number,
          countryCode: record.customer_country_code,
          email: record.customer_email,
        },
        deliveryType: record.delivery_type,
        totalWeight: record.weight,
        totalWidth: record.width,
        totalHeight: record.height,
        totalLength: record.length,
        priceImpact: 1.5,
        orderNumber: on,
        store: user._id,
        // storeOrderID: record.order_id + "",
        storeOrderID: str.toUpperCase(),
      };
      // console.log(obj);
      // console.log(commodity);
      let order = new Order(obj);
      order.rates = rates;
      await order.save();
      orders.push(order);
    }
    return { status: 200, data: orders };
  }

  async addReturnOrder(data) {
    if (
      !data.type ||
      !data.pickup ||
      !data.dropoff ||
      !data.returns ||
      !data.pickupDate ||
      !data.contact ||
      !data.originalOrder
      // !data.token
    ) {
      return { status: 400, message: "Parameters missing" };
    }
    let ro = await Order.findByOriginalOrder(data.originalOrder);
    if (ro) {
      return {
        status: 400,
        message: "return already requested for this order",
      };
    }
    const point1 = {
      lat: data.pickup.location[1],
      lon: data.pickup.location[0],
    };
    const point2 = {
      lat: data.dropoff.location[1],
      lon: data.dropoff.location[0],
    };
    const distance = Distance.between(point1, point2);
    // console.log(distance.human_readable().distance);

    let promo = undefined;
    if (data.promo) {
      // promo = await Promo.applyPromo(user._id, data.promo.toLowerCase());
      promo = await Promo.findById(data.promo);
      if (!promo) {
        return {
          status: 403,
          message:
            "The promo code is not valid, make sure you did not make any typo",
        };
      }
    }

    let commodities = _.map(data.returns, "commodity");
    data.commodities = commodities;
    // let originalOrder = await Order.findById(data.originalOrder);
    let originalOrder = await Order.findOne({
      _id: data.originalOrder,
      status: "delivered",
    }).populate("rates");
    if (!originalOrder) return { status: 400, message: "order not exists" };

    data.store = data.store || originalOrder.store;
    data.storeOrderID =
      this.generateString(9)?.toUpperCase() || originalOrder.storeOrderID;
    data.token = data.token || this.generateString(32);

    data.deliveryType =
      data?.deliveryType?.toLowerCase() ||
      originalOrder?.rates?.items[0]?.service?.toLowerCase();

    data.orderNumber = originalOrder.orderNumber + 1000;
    data.isReturnOrder = true;

    let getPriceObject = {
      pickup: data.pickup,
      dropoff: data.dropoff,
      items: [],
    };
    let commoditiy = await Commodity.find({ _id: { $in: commodities } });
    if (commoditiy.length < 1)
      return { status: 400, message: "commodities not exists" };

    for (let k = 0; k < commoditiy.length; k++) {
      const e = commoditiy[k];
      let it = {
        item: e.name,
        size: [e.width, e.length, e.height, e.weight],
        quantity: e.quantity,
        service: data.deliveryType,
        store: data.store,
      };
      getPriceObject.items.push(it);
    }

    const price = await Price.getPrice(data.store, getPriceObject);
    const rates = await Rates.create(price);

    const order = new Order(data);
    order.rates = rates;
    await order.save();
    return { status: 200, data: order };
  }

  async requestReturnToken(res, data) {
    if (!data._id) {
      return { status: 422, message: "parameters missing" };
    }
    let customToken = randomstring.generate(32);
    let expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    let order = await Order.updateById(data._id, {
      editToken: customToken,
      editTokenExpiry: expiry,
    });
    return Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "return",
        {
          from: "support@hitechsolution.io",
          to: order.contact.email || "asif@hitechsolution.io",
          subject: "Frank Order Return",
          context: {
            otherProperty:
              "https://frankpwa.hitechprime.io/return-order/" + customToken,
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

          resolve({ status: 200, data: order });
        }
      );
    });
  }

  async requestEditingToken(res, data) {
    if (!data._id) {
      return { status: 422, message: "parameters missing" };
    }
    let customToken = randomstring.generate(32);
    let expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    let order = await Order.updateById(data._id, {
      editToken: customToken,
      editTokenExpiry: expiry,
    });
    return Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "edit-order",
        {
          from: "support@hitechsolution.io",
          to: order.contact.email || "asif@hitechsolution.io",
          subject: "Frank Order Edit",
          context: {
            otherProperty:
              "https://frankpwa.hitechprime.io/edit-order/" + customToken,
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

          resolve({ status: 200, data: order });
        }
      );
    });
  }

  async getByEditingToken(token) {
    if (!token) {
      return Promise.reject({ status: 401, message: "invalid token" });
    }
    const order = await Order.findByEditingToken(token);
    if (!order) {
      return Promise.reject({ status: 401, message: "invalid token" });
    }
    return { status: 200, data: order };
  }

  async requestUserLoginForTracking(res, data) {
    if (!data._id) {
      return { status: 422, message: "parameter missing" };
    }
    let customToken = randomstring.generate(32);
    let expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    let order = await Order.findById(data._id);
    if (!order) {
      return { status: 403, message: "Invalid order number" };
    }
    await User.updateUser(order.user._id, {
      tempToken: customToken,
      tempTokenExpiry: expiry,
    });
    return Q.Promise((resolve, reject, notify) => {
      res.mailer.send(
        "login-user",
        {
          from: "support@hitechsolution.io",
          to: order.contact.email || "shakir.byco@gmail.com",
          subject: "Frank User Login",
          context: {
            otherProperty:
              "https://frankpwa.hitechprime.io/requests/track/" +
              order.orderNumber +
              "/" +
              customToken,
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

          resolve({ status: 200, data: { message: "email has been sent" } });
        }
      );
    });
  }

  async addOrder(user, data) {
    console.log(data);
    if (
      !data.type ||
      !data.pickup ||
      !data.dropoff ||
      !data.commodities ||
      !data.pickupDate ||
      !data.contact ||
      !data.totalWeight ||
      !data.totalWidth ||
      !data.totalHeight ||
      !data.totalLength
    ) {
      return { status: 400, message: "Parameters missing" };
    }
    const point1 = {
      lat: data.pickup.location[1],
      lon: data.pickup.location[0],
    };
    const point2 = {
      lat: data.dropoff.location[1],
      lon: data.dropoff.location[0],
    };
    const distance = Distance.between(point1, point2);
    // console.log(distance.human_readable().distance);
    let promo = undefined;
    if (data.promo) {
      // promo = await Promo.applyPromo(user._id, data.promo.toLowerCase());
      promo = await Promo.findById(data.promo);
      if (!promo) {
        return {
          status: 403,
          message:
            "The promo code is not valid, make sure you did not make any typo",
        };
      }
    }
    let userObj = await User.findById(user._id);
    let ratesObj = await ratesController.getRatesWithParam({
      type: data.deliveryType,
      distance: distance.human_readable().distance,
      weight: data.totalWeight,
      width: data.totalWidth,
      height: data.totalHeight,
      length: data.totalLength,
      config: userObj.config,
      priceImpact: data.priceImpact,
      pickup: data.pickup,
      dropoff: data.dropoff,
    });
    let rates = ratesObj.rates;
    if (promo) {
      let price = rates.price * (1 - promo.discount / 100);
      rates.price = price;
      await rates.save();
    }
    if (!rates) {
      rates = await Rates.findById("5cd3f5c7dee30c0017625596");
      // return {
      //   status: 403,
      //   message: "Couldn't find a suitable vehicle for your parcel"
      // };
    }
    const card = await Customer.findByUserId(user._id);
    if (card.length === 0) {
      return {
        status: 403,
        message:
          "You must have to first Add Credit Card information in payment option",
      };
    }
    let commodities = [];
    for (let index = 0; index < data.commodities.length; index++) {
      const element = data.commodities[index];
      const item = new Commodity(element);
      await item.save();
      commodities.push(item._id);
    }
    data.commodities = commodities;

    data.config = userObj.config;
    let num = await Order.countByToday();
    num = parseInt(num) + 1;
    data.orderNumber = data.orderNumber + "" + _.padStart(num, 4, "0");
    // console.log("order number:", data.orderNumber);
    const order = new Order(data);
    order.rates = rates;
    order.user = user._id;
    if (data.preferredTransporter) {
      await notificationsController.sendNotificationToTransporter({
        user: user._id,
        transporter: data.preferredTransporter,
        order: order._id,
        message: "You have received a new request from user",
        type: "assigned",
      });
    }
    await order.save();
    return { status: 200, data: order };
  }

  async breakRoutes(user, body) {
    let orderIds = [];
    if (!body.routes || !body._id)
      return { status: 400, message: "Parameters missing" };

    const originalOrder = await Order.findById(body._id);
    var price = 0;
    for (let index = 0; index < body.routes.length; index++) {
      const data = body.routes[index];
      if (
        !data.pickup ||
        !data.dropoff ||
        !data.pickupDate ||
        !data.contact ||
        !data.transporter
      ) {
        return { status: 400, message: "Parameters missing" };
      }
      try {
        data.type = originalOrder.type;
        data.commodities = originalOrder.commodities;
        data.deliveryType = originalOrder.deliveryType;
        let totalHeight = 0;
        let totalWidth = 0;
        let totalLength = 0;
        let totalWeight = 0;
        for (let index = 0; index < originalOrder.commodities.length; index++) {
          const element = originalOrder.commodities[index];
          totalWeight += element.weight;
        }

        const point1 = {
          lat: data.pickup.location[1],
          lon: data.pickup.location[0],
        };
        const point2 = {
          lat: data.dropoff.location[1],
          lon: data.dropoff.location[0],
        };
        const distance = Distance.between(point1, point2);
        // console.log(distance.human_readable().distance);
        let promo = undefined;
        if (originalOrder.promo) {
          promo = originalOrder.promo;
        }
        let userObj = await User.findById(originalOrder.user._id);
        let ratesObj = await ratesController.getRatesWithParam({
          type: originalOrder.deliveryType,
          distance: distance.human_readable().distance,
          weight: totalWeight,
          width: originalOrder.totalWidth,
          height: originalOrder.totalHeight,
          length: originalOrder.totalLength,
          config: userObj.config,
          priceImpact: data.priceImpact || 1,
          pickup: data.pickup,
          dropoff: data.dropoff,
        });
        let rates = ratesObj.rates;
        price = parseFloat(rates.minPrice) + parseFloat(price);
        if (promo) {
          let price = rates.price * (1 - promo.discount / 100);
          rates.price = price;
          await rates.save();
        }

        const order = new Order(data);
        order.user = originalOrder.user._id;
        order.rates = rates;
        // order.status = "accepted";
        order.subOrder = true;
        let result = await order.save();
        const notificationPayload = {
          order: order._id,
          transporter: data.transporter,
          type: "request",
          message: "You've received a new request",
        };
        // let notification = new Notification(notificationPayload);
        await notificationsController.sendNotificationToTransporter(
          notificationPayload
        );
        // await notification.save();
        orderIds.push(result._id);
      } catch (error) {
        console.log(error);
      }
    }
    let newPrice = new Rates({
      price: price,
      minPrice: price,
      maxPrice: Math.ceil(price * 1.3),
      actualPrice: price,
      calculated: true,
    });
    await newPrice.save();
    let modify = new ModificationLog({
      order: originalOrder._id,
      changelog: { rates: newPrice },
      status: "pending",
      type: "price_change",
    });
    await modify.save();
    let userNotification = {
      order: originalOrder._id,
      user: originalOrder.user._id,
      type: "route",
      message:
        "Your order has been assigned to multiple transporters and is waiting for them to respond",
    };
    await notificationsController.sendNotificationToUser(userNotification);
    let userNotification2 = {
      order: originalOrder._id,
      user: originalOrder.user._id,
      modificationLog: modify._id,
      type: "price_change",
      message:
        "Your order's price has been changed from initial calculation, you need to accept new price before your order can be accepted by transporters",
    };
    await notificationsController.sendNotificationToUser(userNotification2);
    let order = await Order.updateById(body._id, {
      routes: orderIds,
      acceptedNewPrice: false,
    });
    return { status: 200, data: order };
  }

  async updateStatus(user, data, ip) {
    let t = await Transporter.findById(data.transporter || user._id);
    let d = await Transporter.findById(data.driver);
    let v = await Vehicle.findById(data.vehicle);
    if (t?.banned) {
      return { status: 403, message: "Your account has been suspended" };
    }
    if (data.driver) {
      if (d.banned) {
        return { status: 403, message: "Your driver has been suspended" };
      }
    }
    if (data.vehicle) {
      if (!v.approved) {
        return { status: 403, message: "Your vehicle has been suspended" };
      }
    }
    let o = await Order.findById(data._id);
    if (
      o.status === "cancelledbyuser" ||
      o.status === "cancelledbytransporter" ||
      o.status === "cancelledbyadmin"
    ) {
      return { status: 403, message: "Request has been cancelled" };
    }
    if (data.status === "accepted" && o.status !== "pending") {
      return { status: 403, message: "Request has already been accepted" };
    }
    if (data.status === "onmyway" && o.status !== "accepted") {
      return { status: 403, message: "Request failed" };
    }
    if (
      data.status === "picked" &&
      o.status !== "accepted" &&
      o.status !== "onmyway"
    ) {
      return { status: 403, message: "Request failed" };
    }
    if (data.status === "delivered" && o.status !== "picked") {
      return { status: 403, message: "Request failed" };
    }
    let message = "Your order has been delivered";

    let findPromotion = await Promotion.checkPromotion(
      data.transporter || user._id
    );

    let findPromotionDiscount = 0;
    let findPromotionDiscountType = "";

    if (findPromotion) {
      findPromotionDiscount = findPromotion?.discount;
      findPromotionDiscountType = findPromotion?.discountType;
    }

    if (data.status === "accepted") {
      data.transporter = data.driver || user._id;
      message = "Your request has been accepted";
      return this.acceptOrder(user, data, message, o);
    } else if (data.status === "onmyway") {
      message = "Transporter is on his way to pick your order";
    } else if (data.status === "picked") {
      message = "Transporter has picked up your order";
    } else if (data.status === "delivered") {
      data.deliveredDate = new Date(moment(new Date()).format("YYYY-MM-DD"));
      if (o.rates) {
        if (findPromotion) {
          data.promotion = findPromotion?._id;
          if (findPromotionDiscountType === "amount") {   //amount
            o.rates.total = ((o?.rates?.total / 100) * t?.percentage?.percentage) + findPromotionDiscount;
          } else {  // percentage
            t.percentage.percentage =
              t?.percentage?.percentage + findPromotionDiscount;
            o.rates.total = o.rates.total =
              (o?.rates?.total / 100) * parseInt(t?.percentage?.percentage);
          }
        } else {  //no promotion
          o.rates.total =
            (o?.rates?.total / 100) *
            (t?.percentage === null || undefined || 0
              ? 1 * 100
              : t?.percentage?.percentage);
        }

        let tid = o.transporter.isSubDriver
          ? o.transporter.admin
          : o.transporter._id;

        let financeRecord = new Finance({
          status: "pending",
          amount: o?.rates?.total, // created by abdul bari
          transporter: tid,
          order: o._id,
        });
        await financeRecord.save();
      } else {
        return { status: 403, message: "Product rates are not defined" };
      }

      if (o.vehicle) {
        let publicModes = ["air"];
        if (publicModes.indexOf(o.vehicle.mode) > -1) {
          await Vehicle.markExpired(o.vehicle._id);
        }
      }
      let imageUploadResult =
        await UploadServiceComponent.downloadMapImageAndSave(user, o);
      data.staticMap = imageUploadResult.data.path;
      await Schedule.removeOrderForUser(user._id, o._id);
    }
    const order = await Order.updateOrderStatus(data._id, data);
    const updatedOrder = await Order.findById(data._id);

    await notificationsController.sendNotificationToUser({
      user: order.user || order.store,
      transporter: order.transporter,
      order: order._id,
      message: message,
      type: data.status,
    });
    return { status: 200, data: updatedOrder };
  }

  async readyForPickup(user, data, ip) {
    let order = await Order.updateOrderStatus(data._id, {
      readyForPickup: true,
      pickupDate: data.pickupDate,
    });
    if (!order) {
      return { status: 403, message: "Invalid order id" };
    }
    return { status: 200, data: order };
  }

  async updateOrderPickupDate(user, data) {
    if (!data._id) {
      return { status: 400, message: "_id parameter missing" };
    }

    let order = await Order.updateById(data._id, {
      pickupDate: data.pickupDate,
    });

    return { status: 200, data: order };
  }

  async acceptOrder(user, data, message, order) {
    if (data.promoCode) {
      let promo = await Promo.applyPromoForTransporter(
        user._id,
        data.promoCode
      );
      if (!promo) {
        return { status: 403, message: "Invalid promo code" };
      }
      data.transporterPromo = promo._id;
    }
    await Order.updateOrderStatus(data._id, data);
    if (order.subOrder) {
      let allAccepted = true;
      let parentOrder = await Order.findBySubOrderId(data._id);
      for (let index = 0; index < parentOrder.routes.length; index++) {
        const subOrder = parentOrder.routes[index];
        if (subOrder.status !== "accepted") {
          allAccepted = false;
          break;
        }
      }
      if (allAccepted) {
        await Order.updateOrderStatus(parentOrder._id, {
          status: "accepted",
        });
        await notificationsController.sendNotificationToUser({
          user: order.user,
          transporter: user._id,
          order: parentOrder._id,
          message: message,
          type: data.status,
        });
        // return { status: 200, data: order };
      }
      return { status: 200, data: order };
    }
    await notificationsController.sendNotificationToUser({
      user: (order.user || order.store)._id || order.user || order.store,
      transporter: data.transporter,
      order: order._id,
      message: message,
      type: data.status,
    });
    const updatedOrder = await Order.findById(data._id);
    return { status: 200, data: updatedOrder };
  }

  async cancel(user, data, ip) {
    let t = await Transporter.findById(user._id);
    let d = await Transporter.findById(data.driver);
    let v = await Vehicle.findById(data.vehicle);
    if (!data._id) {
      return { status: 403, message: "Parameter missing" };
    }
    if (!data.cancellationReason) {
      return { status: 403, message: "You must specify a reason" };
    }
    if (!data.status) {
      return { status: 403, message: "status parameter missing" };
    }
    data.status = data.status;
    await Order.updateOrderStatus(data._id, data);

    let order = await Order.findById(data._id);
    if (order.status === "picked" || order.status === "onmyway") {
      return {
        status: 405,
        message: "The order is already picked so you can't cancel this order!",
      };
    }
    if (order.status !== "pending") {
      const aDay = 24 * 60 * 60 * 1000;
      const diff = order.pickupDate - new Date();
      // console.log(order.pickupDate);
      // console.log(new Date());
      // console.log("diff:", order.pickupDate - new Date());
      if (diff < aDay) {
        if (data.status === "cancelledbyuser") {
          const card = await Customer.findDefaultCard(order.user._id);
          console.log("card:", card);

          if (!card) {
            return { status: 403, message: "Forbidden" };
          }
          await customersController.charge(
            order.user,
            {
              _id: card._id,
              amount: 5,
              currency: "eur",
              description: "Cancellation charges on " + order._id,
              order: order._id,
            },
            ip
          );
        } else if (data.status === "cancelledbytransporter") {
          if (t.banned) {
            return { status: 403, message: "Your account has been suspended" };
          }
          if (data.driver) {
            if (d.banned) {
              return { status: 403, message: "Your driver has been suspended" };
            }
          }
          if (data.vehicle) {
            if (!v.approved) {
              return {
                status: 403,
                message: "Your vehicle has been suspended",
              };
            }
          }
          await Rates.updateRatesById(order.rates._id, {
            cancellationPenalty: -5,
          });

          let tid = order.transporter.isSubDriver
            ? order.transporter.admin
            : order.transporter._id;
          let financeRecord = await Finance.findPendingByTransporter(tid);

          financeRecord = new Finance({
            status: "pending",
            amount: -5,
            transporter: tid,
            order: order._id,
          });
          await financeRecord.save();

          // if (!financeRecord) {
          //   financeRecord = new Finance({
          //     status: "pending",
          //     amount: -5,
          //     transporter: tid,
          //     orders: [order._id],
          //   });
          //   await financeRecord.save();
          // } else {
          //   financeRecord.amount = parseFloat(financeRecord.amount) - 5;
          //   financeRecord.orders.push(order._id);
          //   await financeRecord.save();
          // }
        }
      }
    }

    await notificationsController.sendNotificationToUser({
      user: order.user || order.store,
      transporter: order.transporter,
      order: order._id,
      message: "Your order has been cancelled",
      type: data.status,
    });
    if (order.transporter) {
      await notificationsController.sendNotificationToTransporter({
        user: order.user,
        transporter: order.transporter,
        order: order._id,
        message: "Your order has been cancelled",
        type: data.status,
      });
    }

    return { status: 200, data: order };
  }

  async rate(user, data) {
    var feedback = new Feedback(data);
    if (data.transporter) {
      let transporter = await Transporter.findById(data.transporter);
      if (data.rating) {
        transporter.rating =
          parseFloat(transporter.rating) + parseFloat(data.rating);
        transporter.totalOrders = parseFloat(transporter.totalOrders) + 1;
        await transporter.save();
        await Order.updateById(data.order, {
          rating: feedback._id,
        });
      }
    } else if (data.user) {
      let user = await User.findById(data.user);
      if (data.rating) {
        user.rating = parseFloat(user.rating) + parseFloat(data.rating);
        user.totalOrders = parseFloat(user.totalOrders) + 1;
        await Order.updateById(data.order, {
          customerRating: feedback._id,
        });
        await user.save();
      }
    }

    return { status: 200, data: await feedback.save() };
  }

  async complain(user, data) {
    if (!data.comment) {
      return Promise.reject({ status: 400, message: "Parameters missing" });
    }
    var complain = new Complain(data);
    complain.type = "complain";
    complain.user = user._id;
    await complain.save();
    return { status: 200, data: complain };
  }

  async fileDispute(user, data) {
    let order = await Order.addDispute(data._id, {
      reason: data.reason,
      filedBy: data.filedBy,
      status: "pending",
    });
    return { status: 200, data: order };
  }

  async assign(user, data) {
    if (!data._id || !data.transporter) {
      return { status: 400, message: "Paramters missing" };
    }
    const admin = await Admin.findById(user._id);
    if (!admin) {
      return { status: 401, message: "Only admin can perform this action" };
    }

    const order = await Order.updateOrderStatus(data._id, data);
    if (!order) {
      return { status: 403, message: "Invalid order id" };
    }

    await notificationsController.sendNotificationToTransporter({
      user: order.user,
      transporter: order.transporter,
      order: order._id,
      message: "Admin has assigned you a new order",
      type: "assigned",
    });
    return { status: 200, data: order };
  }

  async updateOrderByCustomer(user, data) {
    console.log(data);
    if (!data._id) {
      return { status: 400, message: "_id parameter missing" };
    }
    // if (data.commodities) {
    //   return {
    //     status: 400,
    //     message: "commodities must be sent in update API"
    //   };
    // }
    let commodities = [];
    for (let index = 0; index < data.commodities.length; index++) {
      const element = data.commodities[index];
      if (element._id) {
        commodities.push(element._id);
      } else {
        const item = new Commodity(element);
        await item.save();
        commodities.push(item._id);
      }
    }
    data.commodities = commodities;
    let modify = new ModificationLog({
      order: data._id,
      updatedByCustomer: user._id,
      changelog: data,
      status: "approved",
    });
    await modify.save();
    // const order = await Order.findById(data._id);
    await Order.updateById(data._id, data);
    const order = await Order.findById(data._id);
    return { status: 200, data: order };
  }

  async updateOrderPublic(data) {
    console.log(data);
    if (!data.token) {
      return Promise.reject({ status: 401, message: "invalid token" });
    }
    let order = null;
    if (data.user) {
      let user = await User.findByToken(data.token);
      if (user._id != data.user) {
        return Promise.reject({ status: 401, message: "invalid user" });
      }
      order = await Order.findById(data._id);
    } else {
      order = await Order.findByEditingToken(data.token);
    }

    if (!order) {
      return Promise.reject({ status: 401, message: "invalid token" });
    }
    if (!data._id) {
      return { status: 400, message: "_id parameter missing" };
    }
    let modify = new ModificationLog({
      order: data._id,
      changelog: data,
      status: "approved",
    });
    await modify.save();

    await Order.updateById(data._id, data);
    const updatedOrder = await Order.findById(data._id);
    return { status: 200, data: updatedOrder };
  }

  async requestReschedule(user, data) {
    console.log(data);
    if (!data._id) {
      return { status: 400, message: "_id parameter missing" };
    }
    const order = await Order.findById(data._id);
    let modify = new ModificationLog({
      order: data._id,
      changelog: data,
      status: "pending",
      type: "reschedule",
    });
    let notificationData = {
      message:
        "You've received a reschedule request for order # " + order.orderNumber,
      type: "reschedule",
      order: order._id,
    };
    if (data.userType == "transporter") {
      modify.updatedByTransporter = user._id;
      notificationData.user = order.user._id;
    } else {
      modify.updatedByCustomer = user._id;
      notificationData.transporter = (order.transporter || {})._id;
    }
    await modify.save();
    notificationData.modificationLog = modify._id;
    await notificationsController.sendRescheduleRequestToUser(notificationData);

    return { status: 200, data: modify };
  }

  async requestLocationChange(user, data) {
    console.log(data);
    if (!data._id) {
      return { status: 400, message: "_id parameter missing" };
    }
    const order = await Order.findById(data._id);
    let modify = new ModificationLog({
      order: data._id,
      changelog: data,
      status: "pending",
      type: "change_location",
    });
    let notificationData = {
      message:
        "You've received a location change request for order # " +
        order.orderNumber,
      type: "change_location",
      order: order._id,
    };
    if (data.userType == "transporter") {
      modify.updatedByTransporter = user._id;
      notificationData.user = order.user._id;
    } else {
      modify.updatedByCustomer = user._id;
      notificationData.transporter = (order.transporter || {})._id;
    }
    await modify.save();
    notificationData.modificationLog = modify._id;
    await notificationsController.sendRescheduleRequestToUser(notificationData);

    return { status: 200, data: modify };
  }

  async updateOrder(user, data) {
    if (!data._id) {
      return { status: 400, message: "_id parameter missing" };
    }
    // if (data.commodities) {
    //   return {
    //     status: 400,
    //     message: "commodities must be sent in update API"
    //   };
    // }
    // await Order.updateById(data._id, data);
    let confirmationCode = randomstring.generate({
      length: 4,
      charset: "numeric",
    });

    let modify = new ModificationLog({
      order: data._id,
      updatedBy: user._id,
      changelog: data,
      confirmationCode: confirmationCode,
    });
    await modify.save();
    const order = await Order.findById(data._id);
    this.sendSMS({
      mobile: order.user.mobile,
      message:
        "Your order # " +
        order.orderNumber +
        " has been modified, please enter following code to confirm update: " +
        confirmationCode,
    });
    return { status: 200, data: order };
  }

  async confirmUpdateOrder(user, data) {
    if (!data._id) {
      return { status: 400, message: "_id parameter missing" };
    }
    const log = await ModificationLog.findByOrderAndCode(
      data._id,
      data.confirmationCode
    );
    console.log("log: ", log);
    if (!log) {
      return { status: 403, message: "Invalid confirmation code" };
    }
    log.status = "approved";
    await log.save();
    await Order.updateById(data._id, log.changelog);
    const order = await Order.findById(data._id);
    return { status: 200, data: order };
  }

  async getEarningByTransporter(user, transporterId) {
    const earning = await Order.earningByTransporter(transporterId);
    return { status: 200, data: earning };
  }

  async autoBreakRouteById(user, id) {
    const order = await Order.findById(id);
    const pickup = await Journey.findForLocation(order.pickup.location, true);
    console.log(pickup);
    const pickupTransporters = await Transporter.findByJourneys(
      _.map(pickup, "_id")
    );
    const dropoff = await Journey.findForLocation(
      order.dropoff.location,
      false
    );
    console.log(dropoff);
    const dropoffTransporters = await Transporter.findByJourneys(
      _.map(dropoff, "_id")
    );
    return { status: 200, data: { pickupTransporters, dropoffTransporters } };
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
        console.log(err);
        return Promise.reject(err);
      }
      console.log(message.sid);
    });
  }

  async orderByStatus(user) {
    // const orders = await Order.find({});
    const orders = await Order.aggregate([
      // { $unwind: "$rates" },
      {
        $match: { subOrder: false, type: "delivery" },
      },
      { $unwind: "$rates" },
      {
        $group: {
          _id: "$status",
          numRequest: { $sum: 1 },
          totalPrice: { $sum: "$rates.price" },
        },
      },
      // {
      //   $sort: { numRequest: -1 }
      // }
    ]);

    return { status: 200, data: orders };
  }

  async getOrdersByTransporter(user, id) {
    const orders = await Order.findOrdersByTransporter(id);
    for (let i = 0; i < orders.length; i++) {
      const element = orders[i];
      //   element.rates.total =
      //     (element?.rates?.total / 100) *
      //     element?.transporter?.percentage?.percentage;

      element.rates.total =
        (element.rates.total / 100) * element.transporter.percentage.percentage;
    }

    return { status: 200, data: { count: orders.length, orders } };
  }

  async deleteOrder(user, id) {
    await Order.findByIdAndDelete(id);
    return { status: 200, message: "Order deleted successfully" };
  }

  async ordersStats(user, id) {
    let id2;
    if (id == 1) {
      id2 = true;
    } else if (id == 0) {
      id2 = false;
    }

    const orders = await Order.aggregate([
      {
        $match: { isReturnOrder: id2 },
      },
      {
        $project: {
          createdAt: 1,
          status: {
            $cond: {
              if: { $in: ["$status", ["accepted", "onmyway", "picked"]] },
              then: "inprogress",
              else: {
                $cond: {
                  if: {
                    $in: [
                      "$status",
                      [
                        "cancelledbyadmin",
                        "cancelledbystore",
                        "cancelledbyuser",
                        "cancelled",
                      ],
                    ],
                  },
                  then: "cancelled",
                  else: "$status",
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            status: "$status",
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);
    return { status: 200, orders };
  }

  generateString(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = " ";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  async changeDropoffDate(user, orderNumber, data) {
    orderNumber = parseInt(orderNumber);
    const o = await Order.findOne({ orderNumber });
    if (o.status !== "pending") {
      return { status: 400, message: "order already picked" };
    }

    let commodities = await Commodity.find({ _id: { $in: o?.commodities } });
    // console.log(commodities);

    let rates = await Rates.findOne({ _id: o?.rates });

    let items = [];

    for (let i = 0; i < rates.items.length; i++) {
      const item = rates.items[i];
      let size = [
        commodities[i]?.length || 0,
        commodities[i]?.width || 0,
        commodities[i]?.height || 0,
        commodities[i]?.weight || 0,
      ];
      let l = {
        item: item.item,
        size,
        service: data.service.toLowerCase(),
        store: o.store,
        quantity: item.quantity,
      };
      items.push(l);
    }

    let getPriceObject = {
      pickup: o.pickup,
      dropoff: o.dropoff,
      items,
    };
    const price = await Price.getPrice(o.store, getPriceObject);
    if (!price || price?.total < 1) {
      return { status: 400, message: "pricing policy expired or not exists" };
    }
    price.total = data.price;
    for (let k = 0; k < price.items.length; k++) {
      const shippingPrice = price.items[k];
      shippingPrice.shippingPrice = data.price;
    }
    let updatePrice = await Rates.findOneAndUpdate(
      { _id: o?.rates },
      {
        $set: price,
      },
      { new: true }
    );

    let updateOrder = await Order.findOneAndUpdate(
      { orderNumber },
      {
        $set: {
          deliveryType: data.service.toLowerCase(),
          dropoff: data.dropoff,
          deliveryDate: data.deliveryDate,
          deliveryTime: data.deliveryTime,
        },
      },
      { new: true }
    );

    return { status: 200, data: { updateOrder, updatePrice } };
  }

  async aboutToAddress(user, orderNumber, data) {
    orderNumber = parseInt(orderNumber);
    const o = await Order.findOne({ orderNumber });
    if (o.status !== "pending") {
      return { status: 400, message: "order already picked" };
    }

    let updateOrder = await Order.findOneAndUpdate(
      { orderNumber },
      {
        $set: { aboutAddress: data.aboutAddress },
      },
      { new: true }
    );
    return { status: 200, data: updateOrder };
  }
}

var exports = (module.exports = new OrderController());
