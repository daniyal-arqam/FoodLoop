const path = require("path");
const {
  DEMO_ACCOUNTS,
  DEMO_ORGANIZATIONS,
  demoListingPayload,
  demoAgentListingPayload,
} = require("./accounts");

const ROOT = path.resolve(__dirname, "../..");

async function defaultRequest(baseUrl, method, pathname, { token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, body: payload };
}

function requireOk(result, label) {
  if (result.status >= 200 && result.status < 300 && result.body?.success !== false) {
    return result;
  }
  const message = result.body?.message || JSON.stringify(result.body);
  throw new Error(`${label} failed (${result.status}): ${message}`);
}

async function registerOrLogin(request, gatewayUrl, account) {
  const registered = await request(gatewayUrl, "POST", "/api/auth/register", {
    body: {
      name: account.name,
      email: account.email,
      password: account.password,
      role: account.role,
    },
  });
  if (registered.status === 201) {
    return registered.body.data.accessToken;
  }
  if (registered.status !== 409 && registered.status !== 403) {
    requireOk(registered, `register ${account.email}`);
  }
  const login = requireOk(
    await request(gatewayUrl, "POST", "/api/auth/login", {
      body: { email: account.email, password: account.password },
    }),
    `login ${account.email}`
  );
  return login.body.data.accessToken;
}

async function ensureAdmin(mongoUri) {
  const authDatabase = require("../../services/auth-service/src/config/database");
  const User = require("../../services/auth-service/src/models/User");
  const { hashPassword } = require("../../services/auth-service/src/services/passwordService");
  const account = DEMO_ACCOUNTS.admin;

  await authDatabase.connectDatabase(mongoUri);
  let user = await User.findOne({ email: account.email });
  if (!user) {
    user = await User.create({
      name: account.name,
      email: account.email,
      passwordHash: await hashPassword(account.password),
      role: "Admin",
    });
  }
  await authDatabase.disconnectDatabase();
  return user;
}

async function resetDemoListings(mongoUri, providerEmail) {
  const authDatabase = require("../../services/auth-service/src/config/database");
  const User = require("../../services/auth-service/src/models/User");
  const foodDatabase = require("../../services/food-service/src/config/database");
  const FoodListing = require("../../services/food-service/src/models/FoodListing");
  const Claim = require("../../services/food-service/src/models/Claim");

  await authDatabase.connectDatabase(mongoUri);
  const provider = await User.findOne({ email: providerEmail });
  await authDatabase.disconnectDatabase();
  if (!provider) {
    return { deletedListings: 0 };
  }

  await foodDatabase.connectDatabase(mongoUri);
  const listings = await FoodListing.find({ providerId: provider._id }).select("_id");
  const ids = listings.map((item) => item._id);
  if (ids.length) {
    await Claim.deleteMany({ listingId: { $in: ids } });
    await FoodListing.deleteMany({ _id: { $in: ids } });
  }
  await foodDatabase.disconnectDatabase();
  return { deletedListings: ids.length };
}

async function ensureOrganization(request, gatewayUrl, token, payload) {
  const existing = await request(gatewayUrl, "GET", "/api/organizations/profile", { token });
  if (existing.status === 200 && existing.body?.data?.organization) {
    return existing.body.data.organization;
  }
  const created = requireOk(
    await request(gatewayUrl, "POST", "/api/organizations", { token, body: payload }),
    `create org ${payload.organizationName}`
  );
  return created.body.data.organization;
}

async function seedDemo({
  gatewayUrl,
  mongoUri,
  request = defaultRequest,
  resetListings = true,
  createListing = true,
} = {}) {
  const providerToken = await registerOrLogin(request, gatewayUrl, DEMO_ACCOUNTS.provider);
  const orgToken = await registerOrLogin(request, gatewayUrl, DEMO_ACCOUNTS.organization);
  const shelterToken = await registerOrLogin(request, gatewayUrl, DEMO_ACCOUNTS.shelter);

  if (mongoUri) {
    await ensureAdmin(mongoUri);
  }

  const adminLogin = requireOk(
    await request(gatewayUrl, "POST", "/api/auth/login", {
      body: { email: DEMO_ACCOUNTS.admin.email, password: DEMO_ACCOUNTS.admin.password },
    }),
    "admin login"
  );
  const adminToken = adminLogin.body.data.accessToken;

  const kitchen = await ensureOrganization(
    request,
    gatewayUrl,
    orgToken,
    DEMO_ORGANIZATIONS.kitchen
  );
  const shelter = await ensureOrganization(
    request,
    gatewayUrl,
    shelterToken,
    DEMO_ORGANIZATIONS.shelter
  );

  requireOk(
    await request(gatewayUrl, "POST", `/api/organizations/${kitchen.id}/verify`, {
      token: adminToken,
      body: { verified: true },
    }),
    "verify Karachi Food Bank"
  );
  requireOk(
    await request(gatewayUrl, "POST", `/api/organizations/${shelter.id}/verify`, {
      token: adminToken,
      body: { verified: true },
    }),
    "verify Clifton Community Kitchen"
  );

  let listing = null;
  let agentListing = null;
  if (resetListings && mongoUri) {
    await resetDemoListings(mongoUri, DEMO_ACCOUNTS.provider.email);
  }
  if (createListing) {
    const created = requireOk(
      await request(gatewayUrl, "POST", "/api/foods", {
        token: providerToken,
        body: demoListingPayload(),
      }),
      "create demo listing"
    );
    listing = created.body.data.listing;
    const agentCreated = requireOk(
      await request(gatewayUrl, "POST", "/api/foods", {
        token: providerToken,
        body: demoAgentListingPayload(),
      }),
      "create matching-agent listing"
    );
    agentListing = agentCreated.body.data.listing;
  }

  return {
    tokens: { provider: providerToken, organization: orgToken, shelter: shelterToken, admin: adminToken },
    kitchen,
    shelter,
    listing,
    agentListing,
    accounts: DEMO_ACCOUNTS,
  };
}

async function waitForGateway(gatewayUrl, { timeoutMs = 60000, request = defaultRequest } = {}) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const health = await request(gatewayUrl, "GET", "/health");
      if (health.status === 200 && health.body?.data?.status === "ok") {
        return health;
      }
      lastError = new Error(health.body?.message || `health ${health.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw lastError || new Error(`Timed out waiting for ${gatewayUrl}/health`);
}

module.exports = {
  ROOT,
  defaultRequest,
  seedDemo,
  waitForGateway,
  ensureAdmin,
  resetDemoListings,
  DEMO_ACCOUNTS,
  DEMO_ORGANIZATIONS,
  demoListingPayload,
  demoAgentListingPayload,
};
