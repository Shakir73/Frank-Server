const Price = require("./../models/price");
const Store = require("./../models/store");
const moment = require("moment");

class priceController {
  async getPrices(req, res, next) {
    try {
      const prices = await Price.find({
        base_price: { $ne: "base_price" },
        name: { $ne: null },
      }).sort({ createdAt: 1 });
      // const prices = await Price.find({ }).sort({ createdAt: 1 });
      res.status(200).json({ count: prices.length, prices });
    } catch (error) {
      res.status(404).json({
        status: "fial",
        message: error,
      });
    }
  }

  async getPriceById(req, res, next) {
    try {
      // const price = await Price.findOne({ _id: req.params.id, store: { $eq: null } });
      const price = await Price.getPolicyById(req.params.id);
      const p = await Price.findOne({
        _id: req.params.id,
        store: { $eq: null },
      });
      let object = {
        name: p.name,
        preputal: p.preputal,
        addedBy: p.addedBy,
        startDate: p.startDate,
        endDate: p.endDate,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
      // price.push(object);
      res.status(200).json({ price, object });
    } catch (error) {
      res.status(404).json({
        status: "fail",
        message: error,
      });
    }
  }

  async addPrice(req, res, next) {
    try {
      let data = req.body;
      if (!data.startDate || !data.endDate || !data.store || !data.addedBy) {
        return res
          .status(400)
          .json({ status: "failed", message: "parameters are missing" });
      }
      if (new Date(moment(data.startDate).format("YYYY-MM-DD")) < new Date()) {
        data.startDate = new Date(moment().format("YYYY-MM-DD"));
      }
      const user = await Store.findOne({ _id: data.store });
      if (!user) {
        return res
          .status(400)
          .json({ status: "failed", message: "Store not exists" });
      }
      if (data.base_price) {
        return res.status(400).json({
          status: "failed",
          message: "something went wrong with base price",
        });
      }
      if (!data.services) {
        return res
          .status(400)
          .json({ status: "failed", message: "must specify services" });
      }
      if (data.services.length <= 0) {
        return res.status(400).json({
          status: "failed",
          message: "must specify at least one service",
        });
      }
      const store = await Price.find({ store: req.body.store });

      let priceDate = new Date(
        Math.max(...store.map((e) => new Date(e.endDate)))
      );
      let today = new Date();
      let currentDate = `${today.getFullYear()}-${
        today.getMonth() + 1
      }-${today.getDate()}`;
      currentDate = new Date(currentDate);

      if (currentDate < priceDate) {
        return res.status(400).json({
          status: "failed",
          message: "Store price date is not expired",
        });
      }
      if (data.startDate >= data.endDate) {
        return res.status(400).json({
          status: "failed",
          message: "Start data must be less than end date",
        });
      }
      const price = await Price.create(data);
      return res.status(201).json({ data: price });
    } catch (error) {
      res.status(400).json({
        status: "fail",
        message: error,
      });
    }
  }

  async addPolicy(req, res, next) {
    let data = req.body;
    if (!data.addedBy) {
      return res
        .status(400)
        .json({ status: "failed", message: "parameters are missing" });
    }
    if (!data.name) {
      return res
        .status(400)
        .json({ status: "failed", message: "please specify policy name" });
    }
    const services = data.services.map((elem) => {
      elem.serviceName = elem.service;
      delete elem.service;
      return elem;
    });

    let result = {
      services,
      name: data.name,
      preputal: data.preputal,
      active: data.active,
      addedBy: data.addedBy,
      startDate: data.startDate,
      endDate: data.endDate,
    };
    const price = await Price.create(result);
    return res.status(201).json({ data: price });
  }

  async updatePrice(req, res, next) {
    try {
      const price = await Price.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      res.status(200).json({ price });
    } catch (error) {
      res.status(404).json({
        status: "fail",
        message: error,
      });
    }
  }

  async deletePrice(req, res, next) {
    try {
      await Price.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Price Deleted Successfully" });
    } catch (error) {
      res.status(404).json({
        status: "fail",
        message: error,
      });
    }
  }

  async getPrice(req, res, next) {
    try {
      const id = req.params.id;
      const data = req.body;
      const { pickup, dropoff } = data;
      const dataObject = await Price.getPrice(id, data);
      const { items, total } = dataObject;
      return res.status(200).json({ data: { pickup, dropoff, items, total } });
    } catch (error) {
      res.status(404).json({
        status: "fail",
        message: error,
      });
    }
  }

  async getPriceEcommerce(req, res, next) {
    let id = req.params.id;
    let data = req.body;
    for (let j = 0; j < data.items.length; j++) {
      let size =
        (data.items[j].size[0] *
          data.items[j].size[1] *
          data.items[j].size[2]) /
        5000;

      // if (data.items[j].category === undefined || !data.items[j].category) {
      //   data.items[j].category = "General Misc. Item";
      // }
      if (data.items[j].size[3] <= size) {
        if (size <= 1) {
          data.items[j].size = 1;
        } else if (size > 1 && size <= 5) {
          data.items[j].size = 2;
        } else if (size > 5 && size <= 10) {
          data.items[j].size = 3;
        } else if (size > 10 && size <= 20) {
          data.items[j].size = 4;
        }
      } else if (data.items[j].size[3] > size) {
        if (data.items[j].size[3] <= 1) {
          data.items[j].size = 1;
        } else if (data.items[j].size[3] > 1 && data.items[j].size[3] <= 5) {
          data.items[j].size = 2;
        } else if (data.items[j].size[3] > 5 && data.items[j].size[3] <= 10) {
          data.items[j].size = 3;
        } else if (data.items[j].size[3] > 10 && data.items[j].size[3] <= 20) {
          data.items[j].size = 4;
        }
      }
    }
    let maxSize = 0;
    let category = "";
    data.items.forEach((s) => {
      if (s.size > maxSize) {
        maxSize = s.size;
        category = s.category;
      }
    });

    let size;
    if (maxSize == 4) {
      size = "extra_large";
    }
    if (maxSize == 3) {
      size = "large";
    }
    if (maxSize == 2) {
      size = "medium";
    }
    if (maxSize == 1) {
      size = "small";
    }

    let today = moment(new Date()).format("YYYY-MM-DD");
    today = new Date(today);
    const cat = await Price.findOne({
      store: req.params.id,
      "services.size": size,
      $or: [{ endDate: { $gt: today } }, { endDate: { $eq: null } }],
    }).select("services.category");

    if (category === undefined) category = cat.services[0].category;

    const price = await Price.getPriceEcommerce(id, size, category);
    return res.status(200).json({ price });
  }

  async findByService(req, res, next) {
    try {
      // let service = req.params.service;
      // let query = {};
      // if (!service) {
      //     query = { base_price: 'base_price' }
      // } else {
      //     query = { base_price: 'base_price', 'services.serviceName': service }
      // }
      // console.log(service);
      const price = await Price.aggregate([
        { $match: { base_price: "base_price" } },
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
        // { $unwind : '$types'},
        // { $project: { _id: 0, category: '$_id', types: 1 } }
        // {
        //     $group: { _id: '$types' }
        // }
      ]);
      return res.status(200).json({ price });
    } catch (error) {
      res.status(404).json({
        status: "fail",
        message: error,
      });
    }
  }

  async getPolicyByStore(req, res, next) {
    try {
      let today = moment(new Date()).format("YYYY-MM-DD");
      const price = await Price.find({
        store: req.params.id,
        $or: [{ endDate: { $gt: today } }, { endDate: { $eq: null } }],
      });
      res.status(200).json({ price });
    } catch (error) {
      res.status(404).json({
        status: "fail",
        message: error,
      });
    }
  }

  async getPolicyByStores(req, res, next) {
    try {
      let today = moment(new Date()).format("YYYY-MM-DD");
      const price = await Price.find({
        $or: [{ endDate: { $gt: today } }, { endDate: { $eq: null } }],
      });
      res.status(200).json({ price });
    } catch (error) {
      res.status(404).json({
        status: "fail",
        message: error,
      });
    }
  }

  search = async (req, res) => {
    try {
      const data = req.body;
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: "Parameters are missing" });
      }
      let query = {};
      if (data.active !== undefined) {
        query = {
          base_price: { $ne: "base_price" },
          active: data.active,
          $and: [
            { startDate: { $gte: data.startDate } },
            { endDate: { $lte: data.endDate } },
          ],
        };
      } else {
        query = {
          base_price: { $ne: "base_price" },
          active: true,
          $and: [
            { startDate: { $gte: data.startDate } },
            { endDate: { $lte: data.endDate } },
          ],
        };
      }

      const prices = await Price.find(query);
      return res.status(200).json({ data: prices });
    } catch (error) {
      return res.status(400).json({ error });
    }
  };

  async addMultiplePoliciesForStore(req, res, next) {
    try {
      let data = req.body;
      let prices = [];
      for (let i = 0; i < data.policies.length; i++) {
        const e = data.policies[i];
        if (!e.policyId || !e.startDate || !e.endDate || !e.store) {
          return res.status(200).json({ message: "parameters are missing" });
        }
        let price = await Price.findOne({ _id: e.policyId });

        let p = {
          startDate: e.startDate,
          endDate: e.endDate,
          store: e.store,
          policy: e.policyId,
        };

        let services = [];
        for (let j = 0; j < price.services.length; j++) {
          const el = price.services[j];
          let service = {
            size: el.size,
            price: el.price,
            category: el.category,
            serviceName: el.serviceName,
          };
          services.push(service);
        }
        p.services = services;
        let ps = await Price.create(p);
        prices.push(ps);
      }

      return res.status(200).json({ price: prices });
    } catch (error) {
      res.status(404).json({
        status: "fail",
        message: error,
      });
    }
  }

  async addSinglePolicyForStore(req, res, next) {
    try {
      if (!req.body) {
        return res
          .status(404)
          .json({ status: "fail", message: "Parameters are missing" });
      }
      let { startDate, endDate, policyId, store } = req.body;

      const price = await Price.findOne({ _id: policyId });
      let outerObject = {
        startDate: startDate,
        endDate: endDate,
        store: store,
        policy: policyId,
      };

      let servicesArray = price.services.map((element) => {
        return {
          size: element.size,
          price: element.price,
          category: element.category,
          serviceName: element.serviceName,
        };
      });

      const user = await Price.find({ store: store });

      let priceDate = new Date(
        Math.max(...user.map((e) => new Date(e.endDate)))
      );

      let today = new Date();
      let currentDate = new Date(
        `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
      );

      if (currentDate < priceDate) {
        let expiryDate = await Price.findOneAndUpdate(
          { endDate: priceDate, store: store },
          { $set: { endDate } },
          { new: true }
        );
        outerObject.services = servicesArray;
        return res.status(200).json({ prices: expiryDate });
      }

      outerObject.services = servicesArray;
      let prices = await Price.create(outerObject);
      return res.status(200).json({ prices: prices });
    } catch (error) {
      return res.status(404).json({
        status: "fail",
        message: error,
      });
    }
  }

  async singlePolicyForStore(req, res, next) {
    // Inheritance from created Policies (is to applied in free time)
    try {
      let id = req.params.id;
      const { store, startDate, endDate } = req.body.stores[0];
      let stores = [{ store, startDate, endDate }];
      let price = await Price.findOneAndUpdate(
        { _id: id },
        { $addToSet: { stores: stores } },
        { new: true }
      );
      return res.status(200).json({ prices: price });
    } catch (error) {
      return res.status(404).json({
        status: "fail",
        message: error,
      });
    }
  }
}

module.exports = new priceController();
