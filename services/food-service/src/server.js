const createApp = require("./app");
const config = require("./config");
const { connectDatabase } = require("./config/database");

async function start() {
  await connectDatabase();
  const app = createApp();

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`${config.serviceName} listening on port ${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start food-service:", error.message);
  process.exit(1);
});
