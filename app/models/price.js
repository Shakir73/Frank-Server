const { Schema, model, Types } = require("mongoose");
const moment = require("moment");
const priceSchema = new Schema(
  {
    base_price: String,
    name: { type: String, unique: true },
    active: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
    preputal: { type: Boolean, default: false },
    isPriceVisible: { type: Boolean, default: true },
    isServiceVisible: { type: Boolean, default: true },
    store: { type: Schema.ObjectId, ref: "Store" },
    // stores: [{
    //     store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    //     startDate: Date,
    //     endDate: Date
    // }],
    addedBy: { type: Schema.ObjectId, ref: "Admin" },
    policy: { type: Schema.ObjectId, ref: "Price" },
    services: [
      { serviceName: String, size: String, price: Number, category: String },
    ],
  },
  { timestamps: true }
);

priceSchema.statics.getPolicyById = async function (id) {
  const price = await this.aggregate([
    { $match: { _id: Types.ObjectId(id), store: { $eq: null } } },
    { $unwind: "$services" },
    {
      $group: {
        _id: "$services.category",
        types: {
          $push: {
            service: "$services.serviceName",
            size: "$services.size",
            price: "$services.price",
          },
        },
      },
      // { $push: {serviceName: '$services.serviceName', size: '$services.size', price: '$services.price'} } }
    },
    {
      $project: {
        category: "$_id",
        _id: 0,
        types: 1,
      },
    },
  ]);

  return price;
};

priceSchema.statics.getPrice = async function (id, data) {
  let today = moment(new Date()).format("YYYY-MM-DD");
  today = new Date(today);
  // if category is not defined
  let cat = await this.findOne({
    store: id,
    $or: [{ endDate: { $gt: today } }, { endDate: { $eq: null } }],
  }).select("services.category");
  cat = cat.services[0].category;
  // if category is not defined

  let total = 0;

  let price = await this.aggregate([
    {
      $match: {
        store: Types.ObjectId(id),
        $or: [{ endDate: { $gt: today } }, { endDate: { $eq: null } }],
      },
    },
    { $sort: { endDate: 1, createdAt: 1 } },
    {
      $unwind: "$services",
    },
    {
      $project: { services: 1, _id: 0 },
    },
  ]);

  let items = [];
  for (let i = 0; i < price.length; i++) {
    for (let j = 0; j < data.items.length; j++) {
      let size =
        (data.items[j].size[0] *
          data.items[j].size[1] *
          data.items[j].size[2]) /
        5000;

      // if category is not defined
      if (data.items[j].category === undefined || !data.items[j].category)
        data.items[j].category = cat;
      // if category is not defined

      if (data.items[j].size[3] <= size) {
        if (size <= 1) {
          data.items[j].size = "small";
        } else if (size > 1 && size <= 5) {
          data.items[j].size = "medium";
        } else if (size > 5 && size <= 10) {
          data.items[j].size = "large";
        } else if (size > 10 && size <= 20) {
          data.items[j].size = "extra_large";
        }
      } else if (data.items[j].size[3] > size) {
        if (data.items[j].size[3] <= 1) {
          data.items[j].size = "small";
        } else if (data.items[j].size[3] > 1 && data.items[j].size[3] <= 5) {
          data.items[j].size = "medium";
        } else if (data.items[j].size[3] > 5 && data.items[j].size[3] <= 10) {
          data.items[j].size = "large";
        } else if (data.items[j].size[3] > 10 && data.items[j].size[3] <= 20) {
          data.items[j].size = "extra_large";
        }
      }

      if (
        price[i].services.serviceName === data.items[j].service &&
        price[i].services.size === data.items[j].size &&
        price[i].services.category === data.items[j].category
      ) {
        let itemObject = {
          item: data.items[j].item,
          size: data.items[j].size,
          category: data.items[j].category,
          service: data.items[j].service.toLowerCase(),
          quantity: data.items[j].quantity,
          shippingPrice: price[i].services.price,
        };
        // total += itemObject.shippingPrice;
        total = Math.max(itemObject.shippingPrice);
        items.push(itemObject);
      }
    }
  }
  return (newObject = {
    items,
    total,
  });
};

priceSchema.statics.getPriceEcommerce = async function (id, size, category) {
  let price = await this.aggregate([
    {
      $unwind: "$services",
    },
    {
      $match: {
        store: Types.ObjectId(id),
        "services.category": category,
        "services.size": size,
      },
    },
    {
      $project: { _id: 0, "services.serviceName": 1, "services.price": 1 },
    },
  ]);

  let result = {};
  for (let i = 0; i < price.length; i++) {
    result[price[i].services.serviceName] = parseFloat(price[i].services.price);
  }

  result = {
    Classic: result.classic,
    Flex: result.flex,
    Green: result.green,
  };
  return result;
};

priceSchema.statics.getByStore = async function (store, size) {
  let price = await this.aggregate([
    {
      $match: {
        store: Types.ObjectId(store),
        endDate: { $gte: new Date(moment(new Date()).format("YYYY-MM-DD")) },
      },
    },
    { $unwind: "$services" },
    {
      $match: {
        "services.size": { $in: size },
      },
    },
  ]);

  return price;
};

module.exports = model("Price", priceSchema);
