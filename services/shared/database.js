async function connectDatabase(mongoose, uri, options = {}) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || 5000,
  });

  return mongoose.connection;
}

async function disconnectDatabase(mongoose) {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

function getReadyState(mongoose) {
  return mongoose.connection.readyState;
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getReadyState,
};
