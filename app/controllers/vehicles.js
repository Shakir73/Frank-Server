const Vehicle = include("models/vehicle");
const Transporter = include("models/transporter");

class VehiclesController {
  constructor() {}

  async add(user, data) {
    let t = await Transporter.findById(user._id);
    if (t.banned) {
      return { status: 403, message: "Your account has been suspended" };
    }
    if (data._id) {
      const vehicle = await Vehicle.updateById(data._id, data);
      return { status: 200, data: vehicle };
    }
    if (data.private === false ) data.approved = true;  // if public vehicle then aproved true by default
    var vehicle = new Vehicle(data);
    vehicle.transporter = user._id;
    await vehicle.save();
    await Transporter.addVehicle(user._id, vehicle._id);
    return { status: 200, data: vehicle };
  }

  async getVehicles(user) {
    const data = await Vehicle.getByTransporter(user._id);
    return { status: 200, data };
  }

  async getVehiclesByTime(user, type) {
    const data = await Vehicle.getVehiclesByTime(type);
    return { status: 200, count: data.length, data };
  }

  async getById(user, id) {
    const data = await Vehicle.findById(id);
    return { status: 200, data };
  }

  async getAllVehicles(user) {
    const data = await Vehicle.findAll();
    return { status: 200, data };
  }

  // async activate(user, data) {
  //   await Vehicle.activate(data.vehicle);
  //   const response = await Vehicle.findById(data.vehicle);
  //   return { status: 200, data: response };
  // }

  async activate(user, data) {
    console.log("this is vehicle data", data);
    await Vehicle.activate(data.vehicle, {
      approved: data.approved,
    });
    const response = await Vehicle.findById(data.vehicle);
    return { status: 200, data: response };
  }

  // async activate(user, data) {
  //   if (!data.store) {
  //     return { status: 422, message: "Parameter missing" };
  //   }
  //   const updatedUser = await Store.updateUser(data.store, {
  //     active: data.active,
  //   });
  //   return { status: 200, data: updatedUser };
  // }

  async assignDriver(user, data) {
    // await Vehicle.addDriver(data._id, data.driver);
    const vehicle = await Vehicle.updateById(data._id, {
      drivers: [data.driver],
    });
    const response = await Vehicle.findById(data._id);
    return { status: 200, data: response };
  }

  async removeDriver(user, data) {
    await Vehicle.removeDriver(data._id, data.driver);
    const response = await Vehicle.findById(data._id);
    return { status: 200, data: response };
  }

  async toggle(user, data) {
    return Vehicle.toggleActive(data._id, data.active);
  }

  async search(user, text) {
    return Vehicle.search(text);
  }
}

var exports = (module.exports = new VehiclesController());
