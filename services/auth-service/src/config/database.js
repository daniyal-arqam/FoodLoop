const mongoose = require("mongoose");
const config = require("./index");
const {
  connectDatabase: connect,
  disconnectDatabase: disconnect,
  getReadyState,
} = require("../../../shared/database");

async function connectDatabase(uri = config.mongoUri) {
  return connect(mongoose, uri);
}

async function disconnectDatabase() {
  return disconnect(mongoose);
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getReadyState: () => getReadyState(mongoose),
};
