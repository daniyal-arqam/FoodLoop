const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { request, startStack, startAi, listingToMatchInput, organizationToMatchInput } = require("./helpers");
const { seedDemo } = require("../../scripts/demo/seed");
const { DEMO_ACCOUNTS } = require("../../scripts/demo/accounts");

function assertOk(result, label) {
  assert.equal(result.body?.success, true, `${label} should succeed: ${JSON.stringify(result.body)}`);
  assert.ok(result.status >= 200 && result.status < 300, `${label} status ${result.status}`);
}

describe("hackathon demo flow", { concurrency: false }, () => {
  let stack;
  let ai;

  before(async () => {
    stack = await startStack();
    ai = await startAi();
    process.env.AI_SERVICE_URL = ai.url;
  });

  after(async () => {
    if (ai) await ai.close();
    if (stack) await stack.close();
  });

  it("seeds accounts and walks listing, matcher, claim, collect, and AI", async () => {
    const gateway = stack.gateway.url;
    const seeded = await seedDemo({
      gatewayUrl: gateway,
      request,
      resetListings: false,
      createListing: true,
    });

    assert.equal(seeded.listing.status, "Available");
    assert.equal(seeded.listing.foodName, "Vegetarian meal");

    const providerLogin = await request(gateway, "POST", "/api/auth/login", {
      body: { email: DEMO_ACCOUNTS.provider.email, password: DEMO_ACCOUNTS.provider.password },
    });
    assertOk(providerLogin, "provider login");

    const orgLogin = await request(gateway, "POST", "/api/auth/login", {
      body: { email: DEMO_ACCOUNTS.organization.email, password: DEMO_ACCOUNTS.organization.password },
    });
    assertOk(orgLogin, "organization login");
    const orgToken = orgLogin.body.data.accessToken;

    const browsed = await request(gateway, "GET", "/api/foods?category=Prepared", { token: orgToken });
    assertOk(browsed, "browse food");
    const listing = browsed.body.data.listings.find((item) => item.id === seeded.listing.id);
    assert.ok(listing, "seeded listing is searchable");
    assert.equal(listing.status, "Available");

    const profile = await request(gateway, "GET", "/api/organizations/profile", { token: orgToken });
    assertOk(profile, "org profile");
    const organization = profile.body.data.organization;
    assert.equal(organization.verified, true);

    const score = await request(gateway, "POST", "/api/matching/score", {
      token: orgToken,
      body: {
        listing: listingToMatchInput(listing),
        organization: organizationToMatchInput(organization),
      },
    });
    assertOk(score, "matcher score");
    assert.equal(score.body.data.eligible, true);
    assert.ok(score.body.data.breakdown);
    assert.equal(score.body.data.breakdown.category, 1);

    const claimed = await request(gateway, "POST", `/api/foods/${listing.id}/claim`, { token: orgToken });
    assertOk(claimed, "claim");
    assert.equal(claimed.body.data.listing.status, "Reserved");

    const collected = await request(gateway, "POST", `/api/foods/${listing.id}/collect`, { token: orgToken });
    assertOk(collected, "collect");
    assert.equal(collected.body.data.listing.status, "Collected");

    const providerToken = providerLogin.body.data.accessToken;
    const advice = await request(gateway, "POST", "/api/ai/recommend", {
      token: providerToken,
      body: {
        surplusQuantity: 120,
        foodCategory: "Prepared Meals",
        timePattern: "7 PM - 9 PM",
        frequency: "weekly",
        unit: "servings",
        providerName: "Ayesha Khan",
      },
    });
    assertOk(advice, "waste advisor");
    assert.ok(advice.body.data.advice.situationSummary);
    assert.ok(advice.body.data.advice.immediateActions.length);

    const rag = await request(gateway, "POST", "/api/ai/rag/query", {
      token: providerToken,
      body: { question: "What should we consider before redistributing prepared food?" },
    });
    assertOk(rag, "food safety RAG");
    assert.ok(rag.body.data.answer, `RAG answer missing: ${JSON.stringify(rag.body)}`);
    assert.notEqual(
      rag.body.data.answer,
      "The available knowledge base does not provide sufficient information."
    );
    assert.ok(rag.body.data.sources?.length, `RAG must cite knowledge-base sources: ${JSON.stringify(rag.body)}`);

    assert.equal(seeded.agentListing.status, "Available");
    assert.equal(seeded.agentListing.foodName, "Vegetarian meal trays");

    const agent = await request(gateway, "POST", "/api/ai/agent", {
      token: orgToken,
      body: { message: "Find organizations that could use the available vegetarian meals." },
    });
    assertOk(agent, "matching agent");
    const names = (agent.body.data.toolCalls || []).map((item) => item.name);
    assert.ok(names.includes("find_available_food"));
    assert.ok(names.includes("find_organizations"));
    assert.ok(names.includes("calculate_match_score"));
    assert.ok(names.includes("generate_match_recommendation"));
    assert.ok(agent.body.data.recommendations?.length, "agent must return grounded matches");
    assert.match(agent.body.data.recommendations[0].organizationName, /Karachi Food Bank/i);
  });
});
