const path = require("path");

const { resolveJwtSecret } = require("../../../shared/jwtSecret");

require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4001,
  serviceName: process.env.SERVICE_NAME || "auth-service",
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/foodloop",
  jwt: {
    secret: resolveJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
};

module.exports = config;
