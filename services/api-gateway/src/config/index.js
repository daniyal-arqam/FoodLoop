const path = require("path");

const { resolveJwtSecret } = require("../../../shared/jwtSecret");

require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

function getServices() {
  return {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
    food: process.env.FOOD_SERVICE_URL || "http://localhost:4002",
    organization: process.env.ORGANIZATION_SERVICE_URL || "http://localhost:4003",
    matcher: process.env.MATCHER_URL || "http://localhost:8001",
    ai: process.env.AI_SERVICE_URL || "http://localhost:8002",
  };
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 8080,
  serviceName: process.env.SERVICE_NAME || "api-gateway",
  get proxyTimeoutMs() {
    return Number(process.env.PROXY_TIMEOUT_MS) || 10000;
  },
  get aiProxyTimeoutMs() {
    return Number(process.env.AI_PROXY_TIMEOUT_MS) || 30000;
  },
  corsOrigins: process.env.CORS_ORIGINS || "*",
  jwt: {
    get secret() {
      return resolveJwtSecret();
    },
  },
  get services() {
    return getServices();
  },
};

module.exports = config;
