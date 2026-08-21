const { randomUUID } = require("crypto");

function correlationId(req, res, next) {
  const incoming = req.headers["x-request-id"] || req.headers["x-correlation-id"];
  const id = typeof incoming === "string" && incoming.trim() ? incoming.trim() : randomUUID();
  req.correlationId = id;
  res.setHeader("x-request-id", id);
  res.setHeader("x-correlation-id", id);
  next();
}

module.exports = correlationId;
