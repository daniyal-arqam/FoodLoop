async function startMemoryMongo(mongoose, MongoMemoryServer) {
  const systemBinary = process.env.MONGOMS_SYSTEM_BINARY;
  const mongod = await MongoMemoryServer.create({
    binary: systemBinary
      ? { systemBinary }
      : {
          version: process.env.MONGOMS_VERSION || "7.0.14",
        },
  });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  return {
    uri,
    async stop() {
      await mongoose.disconnect();
      await mongod.stop();
    },
  };
}

module.exports = { startMemoryMongo };
