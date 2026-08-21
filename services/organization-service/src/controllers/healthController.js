const config = require("../config");
const { sendSuccess } = require("../utils/apiResponse");
const { getReadyState } = require("../config/database");

async function getHealth(_req, res) {
  const databaseState = getReadyState();
  return sendSuccess(
    res,
    {
      service: config.serviceName,
      status: "ok",
      timestamp: new Date().toISOString(),
      database: databaseState === 1 ? "connected" : "disconnected",
    },
    "Service is healthy"
  );
}

module.exports = { getHealth };
