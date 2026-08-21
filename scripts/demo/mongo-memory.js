#!/usr/bin/env node
const path = require("path");
const { MongoMemoryServer } = require(
  path.join(__dirname, "../../services/food-service/node_modules/mongodb-memory-server")
);

const port = Number(process.env.MONGO_PORT || 27017);

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: { port, dbName: "foodloop", ip: "127.0.0.1" },
    binary: { version: process.env.MONGOMS_VERSION || "7.0.14" },
  });
  process.stdout.write(`FoodLoop in-memory MongoDB listening on ${mongod.getUri()}\n`);

  const shutdown = async () => {
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  await new Promise(() => {});
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
