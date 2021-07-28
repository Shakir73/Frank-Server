const TimeSlot = include("models/timeslot");
const Transporter = include("models/transporter");

class VehiclesController {
  constructor() {}

  async add(user, data) {
    if (!data.dates) {
      if (!data.daily) {
        return { status: 400, success: "failed" };
      }
    }
    let findTime = await TimeSlot.findOne({
      transporter: data.transporter || user._id,
    });
    if (findTime) {
      const timeSlot = await TimeSlot.findByIdAndUpdate(findTime._id, data, {
        runValidators: true,
        new: true,
      });
      return { status: 200, data: timeSlot };
    }
    data.transporter = data.transporter || user._id;

    const timeSlot = await TimeSlot.create(data);
    return { status: 201, data: timeSlot };
  }

  async addTimeSlote(user, data) {
    if (!data || !data.timeSlot)
      return { status: 400, message: "parameters are missing" };

    if (data.timeSlot.length > 1) return { status: 400, message: "failed" };

    const element = data.timeSlot[0];

    if (!element.from || !element.to || !element.startDate)
      return { status: 400, message: "parameters are missing" };

    if (element.startDate > element.endDate)
      return { status: 400, message: "start date must be less than end date" };

    if (element.daily === true && element.endDate) element.endDate = "";

    // Blow code need to be impelemented
    
    // let from = element.from.split(":");
    // let to = element.to.split(":");
    // from = +from[0] * 60 * 60 * 1000 + +from[1] * 60 * 1000;
    // to = +to[0] * 60 * 60 * 1000 + +to[1] * 60 * 1000;
    // if (from > to)
    //   return { status: 400, message: "time from must be less than time to" };

    // if (
    //   (element.daily === false && (!element.startDate || !element.endDate)) ||
    //   (element.daily === true && !element.startDate)
    // ) {
    //   return { status: 400, message: "failed" };
    // }


    data.transporter = data.transporter || user._id;

    let findTime = await TimeSlot.findOne({
      transporter: data.transporter || user._id,
    });

    if (!findTime) {
      const timeSlot = await TimeSlot.create(data);
      return { status: 201, data: timeSlot };
    }

    // for (let i = 0; i < findTime.timeSlot.length; i++) {
    //   const slotes = findTime.timeSlot[i];
    //   let f = slotes.from.split(':');
    //   let t = slotes.to.split(':');

    //   f = (+f[0]* 60 * 60 * 1000) + (+f[1] * 60 * 1000);
    //   t = (+t[0]* 60 * 60 * 1000) + (+t[1] * 60 * 1000);
    //   if ((slotes.daily === true && f <= from && t >= to)) {
    //     return { status: 400, message: 'time already exists' };
    //   }

    //   let lastestDated = new Date(slotes.createdAt);
    //   let yyyy = lastestDated.getFullYear().toString();
    //   let mm = (lastestDated.getMonth() + 1).toString();
    //   mm = mm.length <= 1 ? `0${mm}` : mm;
    //   let dd = lastestDated.getDate().toString();
    //   dd = dd.length <= 1 ? `0${dd}` : dd;
    //   let fullDate = `${yyyy}-${mm}-${dd}`;
    //   console.log(new Date(fullDate));
    // }

    let timeSlot = await TimeSlot.findOneAndUpdate(
      { _id: findTime._id },
      { $addToSet: { timeSlot: data.timeSlot } },
      { new: true }
    );

    return { status: 200, data: timeSlot };
  }

  async getVehicles(user) {
    const data = await TimeSlot.getByTransporter(user._id);
    return { status: 200, data };
  }

  async getById(user, id) {
    const data = await TimeSlot.findById(id);
    return { status: 200, data };
  }

  async getAll(user) {
    const data = await TimeSlot.findAll();
    return { status: 200, count: data.length, data };
  }

  async findBetweenDates(user, data) {
    const timeSlots = await TimeSlot.findByDates(data);
    let sDate = new Date(data.startDate);
    let eDate = new Date(data.endDate);
    let responseObject = {};
    var date = sDate;
    // console.log(sDate);
    // console.log(eDate);

    while (date <= eDate) {
      let key =
        date.getDate() +
        "-" +
        parseInt(parseInt(date.getMonth()) + parseInt(1)) +
        "-" +
        date.getFullYear();
      for (let index = 0; index < timeSlots.length; index++) {
        const element = timeSlots[index];
        if (date >= element.startDate && date <= element.endDate) {
          if (responseObject[key]) {
            responseObject[key].push(element);
          } else {
            responseObject[key] = [element];
          }
        }
      }
      // console.log(date);
      date.setDate(date.getDate() + 1);
    }

    return { status: 200, data: responseObject };
  }

  async getByTransporter(user, id) {
    const data = await TimeSlot.findByTransporter(id);
    return { status: 200, data };
  }

  async deleteById(user, id) {
    await TimeSlot.deleteById(id);
    const data = await TimeSlot.findByTransporter(user._id);
    return { status: 200, data };
  }

  async toggle(user, data) {
    return TimeSlot.toggleActive(data._id, data.active);
  }
}

var exports = (module.exports = new VehiclesController());
