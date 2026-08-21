const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Organization = require("../src/models/Organization");

function validOrganization(overrides = {}) {
  return {
    userId: new mongoose.Types.ObjectId(),
    organizationName: "Karachi Food Bank",
    description: "Community kitchen",
    address: "45 Relief Avenue, Karachi",
    location: {
      latitude: 24.8607,
      longitude: 67.0011,
    },
    foodCategoriesNeeded: ["Produce", "Bakery"],
    requiredQuantity: 50,
    verified: false,
    ...overrides,
  };
}

describe("Organization schema", () => {
  it("references userId as ObjectId and does not duplicate user credentials", () => {
    assert.equal(Organization.schema.path("userId").instance, "ObjectId");
    assert.equal(Organization.schema.path("userId").options.ref, "User");
    assert.equal(Organization.schema.path("userId").options.unique, true);
    assert.equal(Organization.schema.path("email"), undefined);
    assert.equal(Organization.schema.path("passwordHash"), undefined);
  });

  it("uses timestamps and a 2dsphere location index", () => {
    assert.equal(Organization.schema.get("timestamps"), true);
    const indexes = Organization.schema.indexes().map(([fields]) => fields);
    assert.ok(indexes.some((fields) => fields.location === "2dsphere"));
  });

  it("accepts a valid organization and syncs GeoJSON coordinates", async () => {
    const organization = new Organization(validOrganization());
    await organization.validate();
    assert.equal(organization.organizationName, "Karachi Food Bank");
    assert.equal(organization.verified, false);
    assert.equal(organization.location.type, "Point");
    assert.deepEqual(organization.location.coordinates, [67.0011, 24.8607]);
  });

  it("rejects an empty foodCategoriesNeeded list", async () => {
    const organization = new Organization(validOrganization({ foodCategoriesNeeded: [] }));
    await assert.rejects(() => organization.validate(), /at least one category/);
  });

  it("rejects an invalid food category", async () => {
    const organization = new Organization(
      validOrganization({ foodCategoriesNeeded: ["Candy"] })
    );
    await assert.rejects(() => organization.validate(), /Candy|valid food category/);
  });

  it("rejects a negative requiredQuantity", async () => {
    const organization = new Organization(validOrganization({ requiredQuantity: -1 }));
    await assert.rejects(() => organization.validate(), /negative/);
  });

  it("rejects latitude outside bounds", async () => {
    const organization = new Organization(
      validOrganization({
        location: { latitude: -95, longitude: 67 },
      })
    );
    await assert.rejects(() => organization.validate(), /latitude/);
  });
});

const runMongoPersistence = Boolean(
  process.env.RUN_MONGO_TESTS ||
    process.env.MONGODB_URI ||
    process.env.MONGOMS_SYSTEM_BINARY
);
const persistenceDescribe = runMongoPersistence ? describe : describe.skip;

persistenceDescribe("Organization persistence", { concurrency: false }, () => {
  let memory;

  before(async () => {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const { startMemoryMongo } = require("../../shared/memoryMongo");
    memory = await startMemoryMongo(mongoose, MongoMemoryServer);
    await Organization.init();
  });

  after(async () => {
    if (memory) {
      await memory.stop();
    }
  });

  it("saves timestamps", async () => {
    const organization = await Organization.create(validOrganization());
    assert.ok(organization.createdAt);
    assert.ok(organization._id);
  });

  it("enforces one organization profile per user", async () => {
    const userId = new mongoose.Types.ObjectId();
    await Organization.create(validOrganization({ userId }));
    await assert.rejects(
      () => Organization.create(validOrganization({ userId, organizationName: "Other Kitchen" })),
      (error) => error.code === 11000
    );
  });
});
