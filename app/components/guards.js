const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const Customer = require("../models/user");
const Store = require("../models/store");
const Transporter = require("../models/transporter");

class Guard {
  constructor() {}

  encodeToken(user) {
    const info = {
      _id: user._id,
      email: user.email,
      password: user.password,
      mobile: user.mobile,
    };
    if (user.deviceToken) {
      info.deviceToken = user.deviceToken;
      info.platform = user.platform;
    }

    const token = jwt.sign(info, process.env.TOKEN_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    user["token"] = token;
    return user;
  }

  verifyToken = (Model) => async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not loged in to get access",
      });
    }
    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, process.env.TOKEN_SECRET);
    } catch (error) {
      return res.status(401).json({ status: "fail", message: error });
    }
    const user = await Model.findOne({ _id: decoded._id });
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "You are not authorized",
      });
    }
    req.user = user;
    next();
  };

  adminGuard = this.verifyToken(Admin);

  customerGuard = this.verifyToken(Customer);

  storeGuard = this.verifyToken(Store);

  transporterGuard = this.verifyToken(Transporter);
}

module.exports = new Guard();
