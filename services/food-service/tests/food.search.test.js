process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret-do-not-use-in-production";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const createApp = require("../src/app");
const OrganizationLookup = require("../src/models/OrganizationLookup");
const FoodListing = require("../src/models/FoodListing");
const Claim = require("../src/models/Claim");
const { isOverdue } = require("../src/services/expirationService");
const {
  signToken,
  startTestDatabase,
  startTestServer,
  resetData,
  request,
  hoursFromNow,
  listingPayload,
} = require("./helpers/http");

describe("expiration detection", () => {
  it("detects overdue Available listings", () => {
    assert.equal(
      isOverdue({
        status: "Available",
        expiryDate: new Date(Date.now() - 1000),
        availableUntil: new Date(Date.now() + 10000),
      }),
      true
    );
    assert.equal(
      isOverdue({
        status: "Reserved",
        expiryDate: new Date(Date.now() - 1000),
        availableUntil: new Date(Date.now() - 1000),
      }),
      false
    );
  });
});

describe("food-service search", { concurrency: false }, () => {
  let memory;
  let server;
  const providerId = new mongoose.Types.ObjectId();
  const orgUserId = new mongoose.Types.ObjectId();
  const providerToken = signToken(providerId.toString(), "Provider");
  const orgToken = signToken(orgUserId.toString(), "Organization");

  before(async () => {
    memory = await startTestDatabase();
    await FoodListing.init();
    await Claim.init();
    await OrganizationLookup.init();
    server = await startTestServer(createApp());
  });

  after(async () => {
    if (server) await server.close();
    if (memory) await memory.stop();
  });

  beforeEach(async () => {
    await resetData();
    await OrganizationLookup.create({
      userId: orgUserId,
      organizationName: "Karachi Food Bank",
      verified: true,
    });

    await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload({
        foodName: "Bread",
        category: "Bakery",
        quantity: 10,
        expiryDate: hoursFromNow(4),
      }),
    });
    await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload({
        foodName: "Apples",
        category: "Produce",
        quantity: 40,
        expiryDate: hoursFromNow(20),
        pickupLocation: {
          address: "Lahore Kitchen",
          latitude: 31.5204,
          longitude: 74.3587,
        },
      }),
    });
  });

  it("filters by category", async () => {
    const { body } = await request(server.url, "GET", "/foods?category=Bakery", {
      token: orgToken,
    });
    assert.equal(body.data.listings.length, 1);
    assert.equal(body.data.listings[0].category, "Bakery");
  });

  it("filters by minimum and maximum quantity", async () => {
    const { body } = await request(server.url, "GET", "/foods?minQuantity=15&maxQuantity=50", {
      token: orgToken,
    });
    assert.equal(body.data.listings.length, 1);
    assert.equal(body.data.listings[0].foodName, "Apples");
  });

  it("sorts by expiry urgency", async () => {
    const { body } = await request(server.url, "GET", "/foods?urgency=true", {
      token: orgToken,
    });
    assert.equal(body.data.listings[0].foodName, "Bread");
    assert.equal(body.data.listings[1].foodName, "Apples");
  });

  it("filters by distance when coordinates are provided", async () => {
    const { body } = await request(
      server.url,
      "GET",
      "/foods?latitude=24.8607&longitude=67.0011&maxDistanceKm=50",
      { token: orgToken }
    );
    assert.equal(body.data.listings.length, 1);
    assert.equal(body.data.listings[0].foodName, "Bread");
  });

  it("filters by status", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload({ foodName: "Milk", category: "Dairy", quantity: 5 }),
    });
    await request(server.url, "POST", `/foods/${created.body.data.listing.id}/claim`, {
      token: orgToken,
    });

    const available = await request(server.url, "GET", "/foods?status=Available", {
      token: orgToken,
    });
    assert.ok(available.body.data.listings.every((item) => item.status === "Available"));
    assert.ok(!available.body.data.listings.some((item) => item.foodName === "Milk"));
  });
});
