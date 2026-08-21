process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret-do-not-use-in-production";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const createApp = require("../src/app");
const Organization = require("../src/models/Organization");
const {
  signToken,
  startTestDatabase,
  startTestServer,
  resetData,
  request,
  profilePayload,
} = require("./helpers/http");

describe("organization-service", { concurrency: false }, () => {
  let memory;
  let server;
  const orgUserId = new mongoose.Types.ObjectId();
  const otherOrgUserId = new mongoose.Types.ObjectId();
  const providerId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();

  const orgToken = signToken(orgUserId.toString(), "Organization");
  const otherOrgToken = signToken(otherOrgUserId.toString(), "Organization");
  const providerToken = signToken(providerId.toString(), "Provider");
  const adminToken = signToken(adminId.toString(), "Admin");

  before(async () => {
    memory = await startTestDatabase();
    await Organization.init();
    server = await startTestServer(createApp());
  });

  after(async () => {
    if (server) await server.close();
    if (memory) await memory.stop();
  });

  beforeEach(async () => {
    await resetData();
  });

  it("keeps GET /health available", async () => {
    const { status, body } = await request(server.url, "GET", "/health");
    assert.equal(status, 200);
    assert.equal(body.data.service, "organization-service");
  });

  it("lets an organization create an unverified profile", async () => {
    const { status, body } = await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    assert.equal(status, 201);
    assert.equal(body.data.organization.organizationName, "Karachi Food Bank");
    assert.equal(body.data.organization.verified, false);
    assert.equal(body.data.organization.userId, orgUserId.toString());
    assert.deepEqual(body.data.organization.foodCategoriesNeeded, ["Produce", "Bakery"]);
  });

  it("rejects a second profile for the same user", async () => {
    await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    const { status, body } = await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload({ organizationName: "Another Kitchen" }),
    });
    assert.equal(status, 409);
    assert.match(body.message, /already exists/i);
  });

  it("forbids a provider from creating an organization profile", async () => {
    const { status } = await request(server.url, "POST", "/organizations", {
      token: providerToken,
      body: profilePayload(),
    });
    assert.equal(status, 403);
  });

  it("lets an organization read its own profile, including while unverified", async () => {
    await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    const { status, body } = await request(server.url, "GET", "/organizations/profile", {
      token: orgToken,
    });
    assert.equal(status, 200);
    assert.equal(body.data.organization.organizationName, "Karachi Food Bank");
    assert.equal(body.data.organization.verified, false);
  });

  it("returns 404 when the organization has no profile yet", async () => {
    const { status } = await request(server.url, "GET", "/organizations/profile", {
      token: orgToken,
    });
    assert.equal(status, 404);
  });

  it("lets an organization update its own profile and ignores verified", async () => {
    await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    const { status, body } = await request(server.url, "PATCH", "/organizations/profile", {
      token: orgToken,
      body: {
        organizationName: "Karachi Rescue Kitchen",
        requiredQuantity: 80,
        verified: true,
      },
    });
    assert.equal(status, 200);
    assert.equal(body.data.organization.organizationName, "Karachi Rescue Kitchen");
    assert.equal(body.data.organization.requiredQuantity, 80);
    assert.equal(body.data.organization.verified, false);
  });

  it("does not let one organization update another profile via /profile", async () => {
    await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    const { status } = await request(server.url, "PATCH", "/organizations/profile", {
      token: otherOrgToken,
      body: { organizationName: "Hijacked Name" },
    });
    assert.equal(status, 404);
  });

  it("hides unverified organizations from search used for matching", async () => {
    await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    const { body } = await request(server.url, "GET", "/organizations", {
      token: providerToken,
    });
    assert.equal(body.data.organizations.length, 0);
  });

  it("lets an admin verify an organization for matching eligibility", async () => {
    const created = await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    const { status, body } = await request(
      server.url,
      "POST",
      `/organizations/${created.body.data.organization.id}/verify`,
      { token: adminToken }
    );
    assert.equal(status, 200);
    assert.equal(body.data.organization.verified, true);

    const search = await request(server.url, "GET", "/organizations", {
      token: providerToken,
    });
    assert.equal(search.body.data.organizations.length, 1);
    assert.equal(search.body.data.organizations[0].verified, true);
  });

  it("protects verification with Admin RBAC", async () => {
    const created = await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    const asOrg = await request(
      server.url,
      "POST",
      `/organizations/${created.body.data.organization.id}/verify`,
      { token: orgToken }
    );
    const asProvider = await request(
      server.url,
      "POST",
      `/organizations/${created.body.data.organization.id}/verify`,
      { token: providerToken }
    );
    assert.equal(asOrg.status, 403);
    assert.equal(asProvider.status, 403);
  });

  it("returns organization details after verification", async () => {
    const created = await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    await request(server.url, "POST", `/organizations/${created.body.data.organization.id}/verify`, {
      token: adminToken,
    });
    const { status, body } = await request(
      server.url,
      "GET",
      `/organizations/${created.body.data.organization.id}`,
      { token: providerToken }
    );
    assert.equal(status, 200);
    assert.equal(body.data.organization.address, "45 Relief Avenue, Karachi");
    assert.equal(body.data.organization.location.latitude, 24.8607);
  });

  it("lets the owner view their unverified profile by id", async () => {
    const created = await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    const { status, body } = await request(
      server.url,
      "GET",
      `/organizations/${created.body.data.organization.id}`,
      { token: orgToken }
    );
    assert.equal(status, 200);
    assert.equal(body.data.organization.verified, false);
  });

  it("forbids others from viewing an unverified organization", async () => {
    const created = await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload(),
    });
    const { status } = await request(
      server.url,
      "GET",
      `/organizations/${created.body.data.organization.id}`,
      { token: providerToken }
    );
    assert.equal(status, 403);
  });

  it("searches verified organizations by category", async () => {
    const dairy = await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload({ foodCategoriesNeeded: ["Dairy"] }),
    });
    const produce = await request(server.url, "POST", "/organizations", {
      token: otherOrgToken,
      body: profilePayload({
        organizationName: "Produce Pantry",
        foodCategoriesNeeded: ["Produce"],
      }),
    });

    await request(server.url, "POST", `/organizations/${dairy.body.data.organization.id}/verify`, {
      token: adminToken,
    });
    await request(
      server.url,
      "POST",
      `/organizations/${produce.body.data.organization.id}/verify`,
      { token: adminToken }
    );

    const { body } = await request(server.url, "GET", "/organizations?category=Produce", {
      token: providerToken,
    });
    assert.equal(body.data.organizations.length, 1);
    assert.equal(body.data.organizations[0].organizationName, "Produce Pantry");
  });

  it("treats regex metacharacters in search as literals", async () => {
    const created = await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: profilePayload({ organizationName: "Relief Kitchen" }),
    });
    await request(server.url, "POST", `/organizations/${created.body.data.organization.id}/verify`, {
      token: adminToken,
    });

    const poisoned = await request(server.url, "GET", "/organizations?q=(Kitchen", {
      token: providerToken,
    });
    assert.equal(poisoned.status, 200);
    assert.equal(poisoned.body.data.organizations.length, 0);

    const matched = await request(server.url, "GET", "/organizations?q=Kitchen", {
      token: providerToken,
    });
    assert.equal(matched.status, 200);
    assert.equal(matched.body.data.organizations.length, 1);
  });

  it("rejects invalid profile payloads", async () => {
    const { status, body } = await request(server.url, "POST", "/organizations", {
      token: orgToken,
      body: { organizationName: "X" },
    });
    assert.equal(status, 400);
    assert.equal(body.message, "Validation failed");
  });
});
