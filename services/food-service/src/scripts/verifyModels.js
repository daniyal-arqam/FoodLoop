const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { startMemoryMongo } = require("../../../shared/memoryMongo");
const { connectDatabase, disconnectDatabase } = require("../config/database");
const models = require("../models");

async function verify() {
  const names = Object.keys(models);
  let memory;

  try {
    await connectDatabase();
    console.log(`Connected to ${process.env.MONGODB_URI || "configured MongoDB URI"}`);
  } catch (error) {
    console.log(`Local MongoDB unavailable (${error.message}). Starting in-memory MongoDB.`);
    await disconnectDatabase().catch(() => {});
    memory = await startMemoryMongo(mongoose, MongoMemoryServer);
    console.log(`Connected to in-memory MongoDB at ${memory.uri}`);
  }

  for (const name of names) {
    const Model = models[name];
    await Model.init();
    const paths = Object.keys(Model.schema.paths);
    const indexes = Model.schema.indexes().map((entry) => entry[0]);
    console.log(`${name} schema loaded`);
    console.log(`  paths: ${paths.join(", ")}`);
    console.log(`  indexes: ${JSON.stringify(indexes)}`);
  }

  if (memory) {
    await memory.stop();
  } else {
    await disconnectDatabase();
  }

  console.log("Schema verification complete.");
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
