const env = require("dotenv");
const jwtUtil = require("../security/jwtAuth");
const connectToDatabase = require("../db/mongoose");
const { errHandler } = require("../handlers/errorHandlers");

env.config();

const health = {

  getHealthCheck: async (req, res) => {
    const healthCheck = {
      uptime: process.uptime(),
      message: "Unavailable",
      timestamp: Date.now(),
    };
    try {
      await connectToDatabase();
      healthCheck.message = "Healthy";
      res.status(200).json(healthCheck);
    } catch (err) {
      healthCheck.message = "Unavailable";
      res.status(500).json(healthCheck);
    }
  }

};

module.exports = health;
