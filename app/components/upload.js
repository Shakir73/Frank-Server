"use strict";

var s3ClientId = "AKIAI7DYTXQWVBMD3NLA";
var s3ClientSecret = "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";
var endpoint = "https://s3.eu-west-3.amazonaws.com/ppost";

const request = require("request");
const Q = require("q");
var path = require("path");
var fs = require("fs");
var AWS = require("aws-sdk");
const geolib = require("geolib");
// import geolib from "geolib";

var s3 = new AWS.S3({
  accessKeyId: s3ClientId,
  secretAccessKey: s3ClientSecret,
  region: "ap-south-1",
});

class UploadServiceComponent {
  uploadFile(user, file) {
    return Q.Promise((resolve, reject, notify) => {
      const buffer = fs.readFileSync(file.path);
      const params = {
        Bucket: "ppost",
        Key: file.originalname,
        Body: buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      };
      s3.putObject(params, function (err, data) {
        fs.unlink(file.path, (err) => console.log(err));
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log(data);
          resolve({
            status: 200,
            data: {
              path: endpoint + "/" + file.originalname,
            },
          });
        }
      });
    });
  }

  uploadMultipleFiles(file, thumb) {
    return Q.Promise((resolve, reject, notify) => {
      var fileBuffer = fs.readFileSync(file.path);
      var thumbBuffer = fs.readFileSync(thumb.path);

      var params = {
        Bucket: "ppost",
        Key: file.originalname,
        Body: fileBuffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      };
      var result = {};
      s3.putObject(params, function (err, data) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("file response: ===>", data);
          result.path = endpoint + "/" + file.originalname;
          var params = {
            Bucket: "ppost",
            Key: thumb.originalname,
            Body: thumbBuffer,
            ContentType: thumb.mimetype,
            ACL: "public-read",
          };
          s3.putObject(params, function (err, data) {
            console.log("thumb response: ===>", data);
            if (err) {
              console.log(err);
              reject(err);
            } else {
              result.thumb = endpoint + "/" + thumb.originalname;
              console.log("Successfully uploaded data to myBucket/myKey");
              resolve(result);
            }
          });
        }
      });
    });
  }

  async uploadMultipleImages(user, files) {
    return Q.Promise((resolve, reject, notify) => {
      let images = [];
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        var fileBuffer = fs.readFileSync(file.path);

        var params = {
          Bucket: "ppost",
          Key: (new Date() / 1000) * 1000 + file.originalname,
          Body: fileBuffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        };
        s3.putObject(params, function (err, data) {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            console.log("file response: ===>", data);
            images.push(
              endpoint + "/" + (new Date() / 1000) * 1000 + file.originalname
            );
            if (index === files.length - 1) {
              resolve({ path: images });
            }
          }
        });
      }
    });
  }

  async downloadMapImageAndSave(user, order) {
    return Q.Promise((resolve, reject, notify) => {
      const pickup = {
        latitude: order.pickup.location[1],
        longitude: order.pickup.location[0],
      };
      const dropoff = {
        latitude: order.dropoff.location[1],
        longitude: order.dropoff.location[0],
      };

      const center = geolib.getCenter([pickup, dropoff]);
      console.log("center => ", center);

      var GLOBE_WIDTH = 256; // a constant in Google's map projection
      var west = pickup.latitude;
      var east = dropoff.latitude;
      var angle = east - west;
      if (angle < 0) {
        angle += 360;
      }
      const pixelWidth = 640;
      var zoom = Math.round(
        Math.log((pixelWidth * 360) / angle / GLOBE_WIDTH) / Math.LN2
      );

      let url =
        "https://maps.googleapis.com/maps/api/staticmap?center=" +
        center.latitude +
        "," +
        center.longitude +
        "&size=640x480&scale=2&maptype=roadmap&markers=color:red%7Clabel:P%7C" +
        pickup.latitude +
        "," +
        pickup.longitude +
        "&markers=color:red%7Clabel:D%7C" +
        dropoff.latitude +
        "," +
        dropoff.longitude +
        "&key=AIzaSyAmfmux8vHgDjrOhYE5zPw_shsxnQq7DBY";
      const options = {
        method: "GET",
        url: url,
        encoding: null,
      };

      request(options, async function (error, response, body) {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          try {
            // console.log(body);
            // await fs.writeFileSync("files/map.jpg", body, {
            //   encoding: "binary"
            // });
            const params = {
              Bucket: "ppost",
              Key: order._id + "_map.jpeg",
              Body: body,

              ACL: "public-read",
            };
            s3.putObject(params, function (err, data) {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                resolve({
                  status: 200,
                  data: {
                    path: endpoint + "/" + params.Key,
                  },
                });
              }
            });
          } catch (e) {
            console.log("catch: ", e);
            reject({ status: 403, message: "Not found" });
          }
        }
      });
    });
  }
}

module.exports = new UploadServiceComponent();
