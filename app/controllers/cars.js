const Car = include("models/car");
var fs = require("fs");

class CarsController {
  async add(user) {
    let fileData = await fs.readFileSync("files/cars.json");

    let object = JSON.parse(fileData.toString());
    var result = [];
    for (let index = 0; index < object.length; index++) {
      let element = object[index];

      let data = {
        make: element.Make,
        model: element.Model,
        fullName: element.Vehicle,
        length: {
          cm: element["length-cm"],
          inch: element["length-inch"],
          feet: element["length-feet"]
        },
        width: {
          cm: element["width-cm"],
          inch: element["width-inch"],
          feet: element["width-feet"]
        },
        height: {
          cm: element["height-cm"],
          inch: element["height-inch"],
          feet: element["height-feet"]
        },
        capacity: {
          litre:
            typeof element["capacity-litre"] == "number"
              ? element["capacity-litre"]
              : 0,
          cubicInch:
            typeof element["capacity-cubic inch"] == "number"
              ? element["capacity-cubic inch"]
              : 0,
          cubicFeet:
            typeof element["capacity-cubic feet"] == "number"
              ? element["capacity-cubic feet"]
              : 0
        }
      };
      const station = new Car(data);
      await station.save();
      result.push(station);
    }

    return { status: 200, result };
  }
  async changeActiveStatus(user, data) {
    await Car.markInactiveByUser(user._id);
    await Car.markActiveById(data._id);
    await Transporter.updateTransporter(user._id, {
      bankInfo: data._id
    });
    const transporter = await Transporter.findById(user._id);
    return { status: 200, data: transporter };
  }

  async getAll() {
    let cars = await Car.findAll();
    return { status: 200, data: cars };
  }
}

var exports = (module.exports = new CarsController());
