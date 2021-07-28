"use strict";
const Q = require("q");
const Space = include("models/space");

const timeTravel = { standard: 0.6, urgent: 0.7, economy: 0.7 };
class SpaceController {
  updateSpace(user, data) {
    return Space.updateSpaceById(data._id, data);
  }

  async deletetMySpace(user, id) {
    await Space.deleteById(id);
    return this.getMySpaces(user);
  }

  async getById(user, id) {
    let data = await Space.findById(id);
    return { status: 200, data };
  }

  async add(user, data) {
    console.log(data);
    var space = new Space(data);
    if (data.userType == "transporter") {
      space.transporter = user._id;
    } else {
      space.user = user._id;
    }

    await space.save();
    return { status: 200, data: space };
  }

  getAll() {
    return Space.find({ active: true, calculated: { $ne: true } }).exec();
  }
  async getMySpaces(user) {
    let data = await Space.findMySpaces(user._id);
    return { status: 200, data };
  }

  async findNearBy(user, params) {
    let data = await Space.findByCoordinates(params.location);
    return { status: 200, data };
  }

  async findNearByPickupPoints(user, params) {
    let data = await Space.findPickupPointsByCoordinates(params.location);
    return { status: 200, data };
  }
}

var exports = (module.exports = new SpaceController());
