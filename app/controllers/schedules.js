"use strict";
const Q = require("q");
const Schedule = include("models/schedule");

const timeTravel = { standard: 0.6, urgent: 0.7, economy: 0.7 };
class ScheduleController {
  async updateSchedule(user, data) {
    let response = await Schedule.updateScheduleById(data._id, data);
    return { status: 200, data: response };
  }

  async deletetMySchedule(user, id) {
    await Schedule.deleteById(id);
    return this.getMySchedules(user);
  }

  async getById(user, id) {
    let data = await Schedule.findById(id);
    return { status: 200, data };
  }

  async add(user, data) {
    console.log(data);
    let existingRecord = await Schedule.findByUser(user._id);
    if (existingRecord) {
      existingRecord.orders = data.orders;
      await existingRecord.save();
      return { status: 200, data: existingRecord };
    }
    var schedule = new Schedule(data);
    schedule.user = user._id;
    schedule.date = new Date();
    schedule.name = user.mobile;
    await schedule.save();
    return { status: 200, data: schedule };
  }

  getAll() {
    return Schedule.find({ active: true, calculated: { $ne: true } }).exec();
  }
  async getMySchedule(user) {
    let data = await Schedule.findByUser(user._id);
    return { status: 200, data };
  }
}

var exports = (module.exports = new ScheduleController());
