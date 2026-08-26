const createApp = require("./app");
const config = require("./config");
const { startSelfPing } = require("./selfPing");

const app = createApp();

app.listen(config.port, "0.0.0.0", () => {
  console.log(`${config.serviceName} listening on port ${config.port}`);
  startSelfPing(config);
});
