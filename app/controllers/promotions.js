const Promotion = require("./../models/Promotion");
const Transporter = require("./../models/transporter");

class promotionsController {
  add = async (req, res, next) => {
    try {
      const data = {
        ...req.body,
        logger: { addedBy: req.user._id },
      };
      const p = await Promotion.findOne({
        transporters: { $in: data.transporters },
      })
        .sort({ createdAt: -1 })
        .limit(1);
      let dStartDate = new Date(p?.startDate).getTime();
      let dEndDate = new Date(p?.endDate).getTime();
      
      let bodyStartDate = new Date(data.startDate).getTime();
      let bodyEndDate = new Date(data.endDate).getTime();
      

      if (bodyEndDate < bodyStartDate)
        return res
          .status(400)
          .json({ status: "Start data must be less than end date" });

      if (bodyStartDate >= dStartDate && bodyStartDate < dEndDate)
        return res.status(400).json({
          status: "Promotion already exists",
        });

      let transportersIds = [];
      if (
        data.allTransporters &&
        (!data.transporters || data.transporters.length < 1)
      ) {
        let transportersAll = await Transporter.find({});
        for (let i = 0; i < transportersAll.length; i++) {
          const element = transportersAll[i]._id;
          transportersIds.push(element);
        }
        data.transporters = transportersIds;
      } else if (!data.allTransporters && data.transporters.length > 0) {
        data.transporters = data.transporters;
      } else if (
        !data.allTransporters &&
        (!data.transporters || data.transporters.length < 1)
      ) {
        return res.status(400).json({
          status: "Promotion must have transport",
        });
      }
      const promotion = await Promotion.create(data);

      return res.status(201).json({ data: promotion });
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        status: "fail",
        message: error,
      });
    }
  };

  getAll = async (req, res, next) => {
    try {
      const promotions = await Promotion.find().select("-logger");
      
      // const promotions = await Promotion.checkPromotion('6026277358f8f5f79faed4f5'); //Usaman
      // const promotions = await Promotion.checkPromotion('60db5026e5aecb24d73477a4'); // Jawaid
      return res.status(200).json({ data: promotions });
    } catch (error) {
      return res.status(400).json({
        status: "fail",
        message: error,
      });
    }
  };

  updateExpiryDate = async (req, res, next) => {
    try {
      const promo = await Promotion.findOneAndUpdate(
        { _id: req.body._id },
        { $set: { endDate: req.body.endDate } },
        { new: true }
      );
      return res.status(200).json({ data: promo });
    } catch (error) {
      return res.status(400).json({
        status: "fail",
        message: error,
      });
    }
  };

  deleteOne = async (req, res, next) => {
    try {
      await Promotion.deleteOne({ _id: req.params.id });
      return res.status(200).json({ message: "deleted successfully" });
    } catch (error) {
      return res.status(400).json({
        status: "fail",
        message: error,
      });
    }
  };
}

module.exports = new promotionsController();
