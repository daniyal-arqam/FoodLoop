const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const correlationId = require("./middleware/correlationId");
const securityHeaders = require("./middleware/securityHeaders");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const config = require("./config");

function buildCorsOptions(corsOrigins) {
  const raw = String(corsOrigins || "*").trim();
  if (raw === "*") {
    return { origin: true, credentials: false };
  }
  return {
    origin: raw.split(",").map((item) => item.trim()).filter(Boolean),
    credentials: true,
  };
}

function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.use(correlationId);
  app.use(securityHeaders);
  app.use(cors(buildCorsOptions(config.corsOrigins)));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use("/", routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
