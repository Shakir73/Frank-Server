const Station = include("models/station");
var fs = require("fs");

class StationsController {
  async add(user, data) {
    return { status: 401 };
    let fileData = await fs.readFileSync("files/stations.json");

    let object = JSON.parse(fileData.toString());
    var result = [];
    for (let index = 0; index < object.length; index++) {
      const element = object[index];
      var obj = {};
      // console.log(key);
      //   "Country": "Albania",
      // "Code": "AL",
      // "Station Name": "Durrës",
      // "Station Name Slug for Search": "durres",
      // "Station Type": "City Station",
      // "Time Zone": "Europe/Tirane",
      // "GeoPoint (GPS Map: Lat,Lon)": "41.3181821, 19.4538871",
      // "Latitude": 41.3181821,
      // "Longitude": 19.4538871,

      if (element.Latitude && element.Longitude) {
        obj["location"] = [element.Longitude, element.Latitude];
        obj["type"] = "train";
        obj["state"] = element.Code;
        obj["country"] = element.Country;
        obj["city"] = element.Country;
        obj["name"] = element["Station Name"];

        // delete element.coordinates;
        // console.log(element);
        result.push(obj);
        const station = new Station(obj);
        await station.save();
      }
    }
    return { status: 200, result };
  }
  async getAll(user) {
    console.log(user);
    let stations = await Station.findAll();
    return { status: 200, data: stations };
  }

  async searchStation(user, text) {
    let stations = await Station.findByCity(text);
    return { status: 200, data: stations };
  }

  async searchStationByLocation(user, data) {
    let stations = await Station.findByLocation(data.location, data.type);
    return { status: 200, data: stations };
  }
}

var exports = (module.exports = new StationsController());
