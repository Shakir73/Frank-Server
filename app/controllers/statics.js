const Static = include("models/static");
var fs = require("fs");

class StaticsController {
  async addFAQ(user, data) {
    await Static.addFAQ(data);
    return { status: 200, data: { message: "added successfully" } };
  }

  async addBusinessSector(user, data) {
    await Static.addBusinessSector(data.name);
    return { status: 200, data: { message: "added successfully" } };
  }

  async getAll() {
    let data = await Static.findAll();
    return { status: 200, data: data };
  }
}

var exports = (module.exports = new StaticsController());
