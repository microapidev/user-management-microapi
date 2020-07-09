const jwtUtil = require("jsonwebtoken");
const serviceUser = require("../models/service_user");

const auth = async (req, res, next) => {
  try {
    const apiKey = req.query.apikey;
    if (!apiKey)
      return res.status(401).json({
        status: "Failed",
        message:
          "Malformed apikey. please pass apikey as query on url like so ?apikey=YourAPIKey",
      });
    const user = await serviceUser.findOne({ apiKey });
    if (!user) {
      throw new Error("");
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({
      status: "UnAuthorized",
      message: "Request Not permitted",
      data: null,
    });
  }
};

module.exports = auth;
