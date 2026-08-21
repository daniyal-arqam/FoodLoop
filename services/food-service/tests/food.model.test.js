const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const FoodListing = require("../src/models/FoodListing");
const Claim = require("../src/models/Claim");

function futureDate(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
}

function validListing(overrides = {}) {
  const availableFrom = futureDate(1);
  return {
    providerId: new mongoose.Types.ObjectId(),
    foodName: "Fresh bread",
    category: "Bakery",
    quantity: 20,
    unit: "items",
    description: "Day-old loaves",
    pickupLocation: {
      address: "12 Rescue Street, Karachi",
      latitude: 24.8607,
      longitude: 67.0011,
    },
    availableFrom,
    availableUntil: futureDate(8),
    expiryDate: futureDate(12),
    status: "Available",
    ...overrides,
  };
}

function validClaim(overrides = {}) {
  return {
    listingId: new mongoose.Types.ObjectId(),
    organizationId: new mongoose.Types.ObjectId(),
    quantity: 5,
    status: "Reserved",
    ...overrides,
  };
}

describe("FoodListing schema", () => {
  it("references providerId and reservedBy as ObjectIds", () => {
    assert.equal(FoodListing.schema.path("providerId").instance, "ObjectId");
    assert.equal(FoodListing.schema.path("providerId").options.ref, "User");
    assert.equal(FoodListing.schema.path("reservedBy").options.ref, "Organization");
  });

  it("uses timestamps", () => {
    assert.equal(FoodListing.schema.get("timestamps"), true);
  });

  it("defines compound food-search indexes", () => {
    const indexes = FoodListing.schema.indexes().map(([fields]) => fields);
    assert.ok(
      indexes.some(
        (fields) => fields.status === 1 && fields.category === 1 && fields.expiryDate === 1
      )
    );
    assert.ok(indexes.some((fields) => fields.status === 1 && fields.availableUntil === 1));
    assert.ok(indexes.some((fields) => fields.providerId === 1 && fields.status === 1));
    assert.ok(indexes.some((fields) => fields.pickupLocation === "2dsphere"));
  });

  it("accepts a valid listing and syncs GeoJSON coordinates", async () => {
    const listing = new FoodListing(validListing());
    await listing.validate();
    assert.equal(listing.status, "Available");
    assert.equal(listing.claimedQuantity, 0);
    assert.equal(listing.pickupLocation.type, "Point");
    assert.deepEqual(listing.pickupLocation.coordinates, [67.0011, 24.8607]);
  });

  it("rejects an invalid status", async () => {
    const listing = new FoodListing(validListing({ status: "Open" }));
    await assert.rejects(() => listing.validate(), /not a valid food status/);
  });

  it("rejects an invalid category", async () => {
    const listing = new FoodListing(validListing({ category: "Snacks" }));
    await assert.rejects(() => listing.validate(), /not a valid food category/);
  });

  it("rejects claimedQuantity greater than quantity", async () => {
    const listing = new FoodListing(validListing({ claimedQuantity: 25 }));
    await assert.rejects(() => listing.validate(), /cannot exceed quantity/);
  });

  it("rejects availableUntil before availableFrom", async () => {
    const listing = new FoodListing(
      validListing({
        availableFrom: futureDate(10),
        availableUntil: futureDate(1),
      })
    );
    await assert.rejects(() => listing.validate(), /on or after availableFrom/);
  });

  it("requires reservedBy when status is Reserved", async () => {
    const listing = new FoodListing(validListing({ status: "Reserved" }));
    await assert.rejects(() => listing.validate(), /reservedBy is required/);
  });

  it("rejects reservedBy when status is Available", async () => {
    const listing = new FoodListing(
      validListing({ reservedBy: new mongoose.Types.ObjectId() })
    );
    await assert.rejects(() => listing.validate(), /cannot have reservedBy/);
  });

  it("rejects latitude outside bounds", async () => {
    const listing = new FoodListing(
      validListing({
        pickupLocation: {
          address: "Invalid coords",
          latitude: 120,
          longitude: 67,
        },
      })
    );
    await assert.rejects(() => listing.validate(), /latitude/);
  });
});

describe("Claim schema", () => {
  it("references listingId and organizationId as ObjectIds", () => {
    assert.equal(Claim.schema.path("listingId").instance, "ObjectId");
    assert.equal(Claim.schema.path("listingId").options.ref, "FoodListing");
    assert.equal(Claim.schema.path("organizationId").options.ref, "Organization");
  });

  it("accepts a reserved claim", async () => {
    const claim = new Claim(validClaim());
    await claim.validate();
    assert.equal(claim.status, "Reserved");
    assert.ok(claim.claimedAt);
    assert.equal(claim.collectedAt, null);
  });

  it("rejects an invalid claim status", async () => {
    const claim = new Claim(validClaim({ status: "Pending" }));
    await assert.rejects(() => claim.validate(), /not a valid claim status/);
  });

  it("requires collectedAt when status is Collected", async () => {
    const claim = new Claim(validClaim({ status: "Collected" }));
    await assert.rejects(() => claim.validate(), /collectedAt is required/);
  });

  it("accepts a collected claim when collectedAt is present", async () => {
    const claim = new Claim(
      validClaim({
        status: "Collected",
        collectedAt: new Date(),
      })
    );
    await claim.validate();
    assert.equal(claim.status, "Collected");
  });
});

const runMongoPersistence = Boolean(
  process.env.RUN_MONGO_TESTS ||
    process.env.MONGODB_URI ||
    process.env.MONGOMS_SYSTEM_BINARY
);
const persistenceDescribe = runMongoPersistence ? describe : describe.skip;

persistenceDescribe("food-service persistence", { concurrency: false }, () => {
  let memory;

  before(async () => {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const { startMemoryMongo } = require("../../shared/memoryMongo");
    memory = await startMemoryMongo(mongoose, MongoMemoryServer);
    await FoodListing.init();
    await Claim.init();
  });

  after(async () => {
    if (memory) {
      await memory.stop();
    }
  });

  it("saves a listing with timestamps", async () => {
    const listing = await FoodListing.create(validListing());
    assert.ok(listing.createdAt);
    assert.ok(listing._id);
  });

  it("prevents two active reservations for the same org and listing", async () => {
    const listingId = new mongoose.Types.ObjectId();
    const organizationId = new mongoose.Types.ObjectId();
    await Claim.create(validClaim({ listingId, organizationId }));
    await assert.rejects(
      () => Claim.create(validClaim({ listingId, organizationId })),
      (error) => error.code === 11000
    );
  });
});
