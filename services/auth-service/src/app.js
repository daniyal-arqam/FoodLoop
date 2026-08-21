const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const securityHeaders = require("../../shared/securityHeaders");

function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.use(securityHeaders);
  app.use(cors({ origin: true, credentials: false }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use("/", routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
