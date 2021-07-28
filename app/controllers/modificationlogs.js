const ModificationLog = include("models/modificationlog");
const Order = include("models/order");

class ModificationLogsController {
  async getById(user, id) {
    let log = await ModificationLog.findById(id);
    return { status: 200, data: log };
  }

  async acceptModificationRequest(user, data) {
    if (!data._id) {
      return { status: 400, message: "_id parameter missing" };
    }
    const log = await ModificationLog.findById(data._id);
    console.log("log: ", log);
    if (!log) {
      return { status: 403, message: "Invalid id" };
    }
    log.status = "approved";
    await log.save();
    await Order.updateById(log.order, log.changelog);
    const order = await Order.findById(log.order);
    return { status: 200, data: order };
  }
}

var exports = (module.exports = new ModificationLogsController());
