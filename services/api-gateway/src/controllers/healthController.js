const config = require("../config");
const { sendSuccess } = require("../utils/apiResponse");

async function getHealth(req, res) {
  return sendSuccess(
    res,
    {
      service: config.serviceName,
      status: "ok",
      timestamp: new Date().toISOString(),
      requestId: req.correlationId,
      upstream: config.services,
    },
    "Service is healthy"
  );
}

module.exports = { getHealth };
