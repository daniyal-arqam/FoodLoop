process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret-do-not-use-in-production";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const createApp = require("../src/app");
const OrganizationLookup = require("../src/models/OrganizationLookup");
const FoodListing = require("../src/models/FoodListing");
const Claim = require("../src/models/Claim");
const { expireOverdueListings } = require("../src/services/expirationService");
const {
  signToken,
  startTestDatabase,
  startTestServer,
  resetData,
  request,
  hoursFromNow,
  listingPayload,
} = require("./helpers/http");

describe("food-service lifecycle", { concurrency: false }, () => {
  let memory;
  let server;
  const providerId = new mongoose.Types.ObjectId();
  const otherProviderId = new mongoose.Types.ObjectId();
  const orgUserId = new mongoose.Types.ObjectId();
  const unverifiedOrgUserId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  const providerToken = signToken(providerId.toString(), "Provider");
  const otherProviderToken = signToken(otherProviderId.toString(), "Provider");
  const orgToken = signToken(orgUserId.toString(), "Organization");
  const unverifiedOrgToken = signToken(unverifiedOrgUserId.toString(), "Organization");
  const adminToken = signToken(adminId.toString(), "Admin");

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
    await OrganizationLookup.create({
      userId: unverifiedOrgUserId,
      organizationName: "Unverified Kitchen",
      verified: false,
    });
  });

  it("keeps GET /health available", async () => {
    const { status, body } = await request(server.url, "GET", "/health");
    assert.equal(status, 200);
    assert.equal(body.data.service, "food-service");
  });

  it("lets a provider create an Available listing", async () => {
    const { status, body } = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    assert.equal(status, 201);
    assert.equal(body.data.listing.status, "Available");
    assert.equal(body.data.listing.providerId, providerId.toString());
    assert.equal(body.data.listing.reservedBy, null);
  });

  it("forbids an organization from creating listings", async () => {
    const { status } = await request(server.url, "POST", "/foods", {
      token: orgToken,
      body: listingPayload(),
    });
    assert.equal(status, 403);
  });

  it("lets a provider update their own Available listing", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    const { status, body } = await request(
      server.url,
      "PATCH",
      `/foods/${created.body.data.listing.id}`,
      { token: providerToken, body: { foodName: "Sourdough loaves", quantity: 15 } }
    );
    assert.equal(status, 200);
    assert.equal(body.data.listing.foodName, "Sourdough loaves");
    assert.equal(body.data.listing.quantity, 15);
  });

  it("forbids a provider from updating someone else's listing", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    const { status } = await request(server.url, "PATCH", `/foods/${created.body.data.listing.id}`, {
      token: otherProviderToken,
      body: { foodName: "Stolen bread" },
    });
    assert.equal(status, 403);
  });

  it("blocks unverified organizations from claiming", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    const { status, body } = await request(
      server.url,
      "POST",
      `/foods/${created.body.data.listing.id}/claim`,
      { token: unverifiedOrgToken }
    );
    assert.equal(status, 403);
    assert.match(body.message, /verified/i);
  });

  it("transitions Available → Reserved on claim and records organization plus claimedAt", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    const { status, body } = await request(
      server.url,
      "POST",
      `/foods/${created.body.data.listing.id}/claim`,
      { token: orgToken, body: { quantity: 20 } }
    );

    assert.equal(status, 200);
    assert.equal(body.data.listing.status, "Reserved");
    assert.ok(body.data.listing.reservedBy);
    assert.equal(body.data.claim.status, "Reserved");
    assert.equal(body.data.claim.quantity, 20);
    assert.ok(body.data.claim.claimedAt);
    assert.equal(body.data.claim.collectedAt, null);

    const mine = await request(server.url, "GET", "/foods?mine=true", {
      token: providerToken,
    });
    assert.equal(mine.status, 200);
    assert.equal(mine.body.data.listings.length, 1);
    assert.equal(mine.body.data.listings[0].status, "Reserved");
  });

  it("lets an organization see only its own reserved listings", async () => {
    const otherOrgUserId = new mongoose.Types.ObjectId();
    const otherOrgToken = signToken(otherOrgUserId.toString(), "Organization");
    await OrganizationLookup.create({
      userId: otherOrgUserId,
      organizationName: "Other Kitchen",
      verified: true,
    });

    const first = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload({ foodName: "Vegetarian meal" }),
    });
    const second = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload({ foodName: "Rice trays" }),
    });
    await request(server.url, "POST", `/foods/${first.body.data.listing.id}/claim`, {
      token: orgToken,
    });
    await request(server.url, "POST", `/foods/${second.body.data.listing.id}/claim`, {
      token: otherOrgToken,
    });

    const reserved = await request(server.url, "GET", "/foods?status=Reserved", {
      token: orgToken,
    });
    assert.equal(reserved.status, 200);
    assert.equal(reserved.body.data.listings.length, 1);
    assert.equal(reserved.body.data.listings[0].foodName, "Vegetarian meal");
  });

  it("rejects a second claim on a Reserved listing", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    await request(server.url, "POST", `/foods/${created.body.data.listing.id}/claim`, {
      token: orgToken,
    });
    const second = await request(server.url, "POST", `/foods/${created.body.data.listing.id}/claim`, {
      token: orgToken,
    });
    assert.equal(second.status, 409);
    assert.match(second.body.message, /cannot be claimed again/i);
  });

  it("transitions Reserved → Collected and records collectedAt", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    await request(server.url, "POST", `/foods/${created.body.data.listing.id}/claim`, {
      token: orgToken,
    });
    const { status, body } = await request(
      server.url,
      "POST",
      `/foods/${created.body.data.listing.id}/collect`,
      { token: orgToken }
    );

    assert.equal(status, 200);
    assert.equal(body.data.listing.status, "Collected");
    assert.equal(body.data.claim.status, "Collected");
    assert.ok(body.data.claim.collectedAt);
  });

  it("transitions Available → Expired and rejects claims on expired listings", async () => {
    const created = await FoodListing.create({
      providerId,
      ...listingPayload({
        availableFrom: hoursFromNow(-48),
        availableUntil: hoursFromNow(-2),
        expiryDate: hoursFromNow(-1),
      }),
      pickupLocation: {
        address: "12 Rescue Street, Karachi",
        latitude: 24.8607,
        longitude: 67.0011,
      },
    });

    const expiredCount = await expireOverdueListings();
    assert.equal(expiredCount, 1);

    const { status, body } = await request(server.url, "POST", `/foods/${created._id}/claim`, {
      token: orgToken,
    });
    assert.equal(status, 409);
    assert.match(body.message, /expired/i);

    const fetched = await request(server.url, "GET", `/foods/${created._id}`, {
      token: orgToken,
    });
    assert.equal(fetched.body.data.listing.status, "Expired");
  });

  it("rejects collecting an Available listing", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    const { status, body } = await request(
      server.url,
      "POST",
      `/foods/${created.body.data.listing.id}/collect`,
      { token: orgToken }
    );
    assert.equal(status, 409);
    assert.match(body.message, /only reserved listings can be collected/i);
  });

  it("rejects collecting a listing reserved by another organization", async () => {
    const otherOrgUserId = new mongoose.Types.ObjectId();
    const otherOrgToken = signToken(otherOrgUserId.toString(), "Organization");
    await OrganizationLookup.create({
      userId: otherOrgUserId,
      organizationName: "Other Kitchen",
      verified: true,
    });
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    await request(server.url, "POST", `/foods/${created.body.data.listing.id}/claim`, {
      token: orgToken,
    });
    const { status, body } = await request(
      server.url,
      "POST",
      `/foods/${created.body.data.listing.id}/collect`,
      { token: otherOrgToken }
    );
    assert.equal(status, 403);
    assert.match(body.message, /reserving organization/i);
  });

  it("rejects claiming a Collected listing", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    await request(server.url, "POST", `/foods/${created.body.data.listing.id}/claim`, {
      token: orgToken,
    });
    await request(server.url, "POST", `/foods/${created.body.data.listing.id}/collect`, {
      token: orgToken,
    });
    const { status, body } = await request(
      server.url,
      "POST",
      `/foods/${created.body.data.listing.id}/claim`,
      { token: orgToken }
    );
    assert.equal(status, 409);
    assert.match(body.message, /collected listings cannot be claimed/i);
  });

  it("rejects updating a Reserved listing", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    await request(server.url, "POST", `/foods/${created.body.data.listing.id}/claim`, {
      token: orgToken,
    });
    const { status, body } = await request(
      server.url,
      "PATCH",
      `/foods/${created.body.data.listing.id}`,
      { token: providerToken, body: { quantity: 99 } }
    );
    assert.equal(status, 409);
    assert.match(body.message, /only available listings can be updated/i);
  });

  it("forbids a provider from claiming food", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    const { status } = await request(
      server.url,
      "POST",
      `/foods/${created.body.data.listing.id}/claim`,
      { token: providerToken }
    );
    assert.equal(status, 403);
  });

  it("lets an admin manage another provider's listing", async () => {
    const created = await request(server.url, "POST", "/foods", {
      token: providerToken,
      body: listingPayload(),
    });
    const { status, body } = await request(
      server.url,
      "PATCH",
      `/foods/${created.body.data.listing.id}`,
      { token: adminToken, body: { description: "Admin updated" } }
    );
    assert.equal(status, 200);
    assert.equal(body.data.listing.description, "Admin updated");
  });
});
