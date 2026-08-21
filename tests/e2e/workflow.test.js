const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const {
  hoursFromNow,
  request,
  startStack,
  listingToMatchInput,
  organizationToMatchInput,
} = require("./helpers");

function assertOk(result, label) {
  assert.equal(result.body?.success, true, `${label} should succeed: ${JSON.stringify(result.body)}`);
  assert.ok(result.status >= 200 && result.status < 300, `${label} status ${result.status}`);
}

describe("FoodLoop core business workflow", { concurrency: false }, () => {
  let stack;

  before(async () => {
    stack = await startStack();
  });

  after(async () => {
    if (stack) {
      await stack.close();
    }
  });

  it("runs provider listing, matcher recommendation, claim, and collection without mocks", async () => {
    const gateway = stack.gateway.url;

    const providerRegistered = await request(gateway, "POST", "/api/auth/register", {
      body: {
        name: "Ayesha Khan",
        email: "ayesha.provider@example.com",
        password: "Password1",
        role: "Provider",
      },
    });
    assert.equal(providerRegistered.status, 201);
    assertOk(providerRegistered, "provider register");

    const providerLogin = await request(gateway, "POST", "/api/auth/login", {
      body: { email: "ayesha.provider@example.com", password: "Password1" },
    });
    assertOk(providerLogin, "provider login");
    const providerToken = providerLogin.body.data.accessToken;

    const created = await request(gateway, "POST", "/api/foods", {
      token: providerToken,
      body: {
        foodName: "Vegetarian meal",
        category: "Prepared",
        quantity: 30,
        unit: "servings",
        description: "Packed vegetarian trays for same-day rescue",
        pickupLocation: {
          address: "12 Rescue Street, Karachi",
          latitude: 24.8607,
          longitude: 67.0011,
        },
        availableFrom: hoursFromNow(-1),
        availableUntil: hoursFromNow(8),
        expiryDate: hoursFromNow(6),
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.listing.foodName, "Vegetarian meal");
    assert.equal(created.body.data.listing.status, "Available");
    const listingId = created.body.data.listing.id;

    const orgRegistered = await request(gateway, "POST", "/api/auth/register", {
      body: {
        name: "Karachi Food Bank",
        email: "kitchen.org@example.com",
        password: "Password1",
        role: "Organization",
      },
    });
    assert.equal(orgRegistered.status, 201);
    assertOk(orgRegistered, "organization register");

    const orgLogin = await request(gateway, "POST", "/api/auth/login", {
      body: { email: "kitchen.org@example.com", password: "Password1" },
    });
    assertOk(orgLogin, "organization login");
    const orgToken = orgLogin.body.data.accessToken;

    const profile = await request(gateway, "POST", "/api/organizations", {
      token: orgToken,
      body: {
        organizationName: "Karachi Food Bank",
        description: "Community kitchen",
        address: "Harbour Front, Karachi",
        location: { latitude: 24.8607, longitude: 67.0011 },
        foodCategoriesNeeded: ["Prepared", "Produce"],
        requiredQuantity: 25,
      },
    });
    assert.equal(profile.status, 201);
    assert.equal(profile.body.data.organization.verified, false);
    const organization = profile.body.data.organization;

    const blockedClaim = await request(gateway, "POST", `/api/foods/${listingId}/claim`, {
      token: orgToken,
    });
    assert.equal(blockedClaim.status, 403);

    const adminLogin = await request(gateway, "POST", "/api/auth/login", {
      body: { email: "admin@foodloop.org", password: "AdminPass1" },
    });
    assertOk(adminLogin, "admin login");
    const adminToken = adminLogin.body.data.accessToken;

    const verified = await request(gateway, "POST", `/api/organizations/${organization.id}/verify`, {
      token: adminToken,
      body: { verified: true },
    });
    assertOk(verified, "admin verify");
    assert.equal(verified.body.data.organization.verified, true);

    const searched = await request(gateway, "GET", "/api/foods?category=Prepared", {
      token: orgToken,
    });
    assertOk(searched, "organization search");
    const found = searched.body.data.listings.find((item) => item.id === listingId);
    assert.ok(found, "organization search should include the vegetarian meal");
    assert.equal(found.status, "Available");

    const viewed = await request(gateway, "GET", `/api/foods/${listingId}`, {
      token: orgToken,
    });
    assertOk(viewed, "view food");
    assert.equal(viewed.body.data.listing.foodName, "Vegetarian meal");
    assert.equal(viewed.body.data.listing.status, "Available");

    const liveOrg = verified.body.data.organization;
    const score = await request(gateway, "POST", "/api/matching/score", {
      token: orgToken,
      body: {
        listing: listingToMatchInput(viewed.body.data.listing),
        organization: organizationToMatchInput(liveOrg),
      },
    });
    assertOk(score, "matcher score");
    assert.equal(score.body.data.eligible, true);
    assert.ok(score.body.data.total_score > 0);
    assert.equal(score.body.data.listing_id, listingId);

    const ranked = await request(gateway, "POST", "/api/matching/find", {
      token: orgToken,
      body: {
        listing: listingToMatchInput(viewed.body.data.listing),
        organizations: [organizationToMatchInput(liveOrg)],
      },
    });
    assertOk(ranked, "matcher find");
    assert.equal(ranked.body.data.count, 1);
    assert.equal(ranked.body.data.matches[0].organization_id, liveOrg.id);
    assert.equal(ranked.body.data.matches[0].eligible, true);

    const claimed = await request(gateway, "POST", `/api/foods/${listingId}/claim`, {
      token: orgToken,
    });
    assertOk(claimed, "claim food");
    assert.equal(claimed.body.data.listing.status, "Reserved");
    assert.equal(claimed.body.data.claim.status, "Reserved");

    const providerListings = await request(gateway, "GET", "/api/foods?mine=true", {
      token: providerToken,
    });
    assertOk(providerListings, "provider listings");
    assert.equal(providerListings.body.data.listings[0].status, "Reserved");
    assert.equal(providerListings.body.data.listings[0].foodName, "Vegetarian meal");

    const collected = await request(gateway, "POST", `/api/foods/${listingId}/collect`, {
      token: orgToken,
    });
    assertOk(collected, "collect food");
    assert.equal(collected.body.data.listing.status, "Collected");
    assert.equal(collected.body.data.claim.status, "Collected");
    assert.ok(collected.body.data.claim.collectedAt);

    const completed = await request(gateway, "GET", `/api/foods/${listingId}`, {
      token: providerToken,
    });
    assertOk(completed, "provider sees collected listing");
    assert.equal(completed.body.data.listing.status, "Collected");
  });

  it("expires overdue Available listings and rejects claims", async () => {
    const gateway = stack.gateway.url;

    const providerLogin = await request(gateway, "POST", "/api/auth/login", {
      body: { email: "ayesha.provider@example.com", password: "Password1" },
    });
    const providerToken = providerLogin.body.data.accessToken;
    const orgLogin = await request(gateway, "POST", "/api/auth/login", {
      body: { email: "kitchen.org@example.com", password: "Password1" },
    });
    const orgToken = orgLogin.body.data.accessToken;

    const created = await request(gateway, "POST", "/api/foods", {
      token: providerToken,
      body: {
        foodName: "Expired salad",
        category: "Produce",
        quantity: 8,
        unit: "kg",
        pickupLocation: {
          address: "12 Rescue Street, Karachi",
          latitude: 24.8607,
          longitude: 67.0011,
        },
        availableFrom: hoursFromNow(-48),
        availableUntil: hoursFromNow(-2),
        expiryDate: hoursFromNow(-1),
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.listing.status, "Available");
    const listingId = created.body.data.listing.id;

    const browsed = await request(gateway, "GET", "/api/foods", { token: orgToken });
    assertOk(browsed, "browse after expiry job");
    assert.equal(
      browsed.body.data.listings.some((item) => item.id === listingId),
      false
    );

    const expired = await request(gateway, "GET", `/api/foods/${listingId}`, {
      token: providerToken,
    });
    assert.equal(expired.body.data.listing.status, "Expired");

    const claim = await request(gateway, "POST", `/api/foods/${listingId}/claim`, {
      token: orgToken,
    });
    assert.equal(claim.status, 409);
  });
});
