const models = require("../models");

async function verifySchemas() {
  for (const [name, Model] of Object.entries(models)) {
    const paths = Object.keys(Model.schema.paths);
    const indexes = Model.schema.indexes().map((entry) => entry[0]);
    console.log(`${name} schema loaded`);
    console.log(`  collection: ${Model.collection.collectionName}`);
    console.log(`  paths: ${paths.join(", ")}`);
    console.log(`  indexes: ${JSON.stringify(indexes)}`);
  }
  console.log("Schema load complete (no database connection required).");
}

verifySchemas().catch((error) => {
  console.error(error);
  process.exit(1);
});
