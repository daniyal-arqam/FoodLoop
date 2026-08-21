process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret-do-not-use-in-production";
process.env.PROXY_TIMEOUT_MS = "200";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");
const createApp = require("../src/app");

function signToken(role = "Provider") {
  return jwt.sign({ userId: "64b0f2c2c2c2c2c2c2c2c2c2", role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

function startStub(name) {
  const app = express();
  app.use(express.json());
  app.use((req, res) => {
    if (req.path === "/slow") {
      setTimeout(() => res.json({ service: name, slow: true }), 500);
      return;
    }
    res.json({
      service: name,
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      authorization: req.headers.authorization || null,
      correlationId: req.headers["x-correlation-id"] || null,
      xUserId: req.headers["x-user-id"] || null,
      xUserRole: req.headers["x-user-role"] || null,
      body: req.body,
    });
  });

  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((done, reject) => server.close((err) => (err ? reject(err) : done()))),
      });
    });
  });
}

async function listen(app) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((done, reject) => server.close((err) => (err ? reject(err) : done()))),
  };
}

async function request(baseUrl, method, pathname, { token, body, headers } = {}) {
  const requestHeaders = { Accept: "application/json", ...(headers || {}) };
  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, body: payload, headers: response.headers };
}

describe("api-gateway routing", { concurrency: false }, () => {
  let stubs;
  let gateway;

  before(async () => {
    stubs = {
      auth: await startStub("auth-service"),
      food: await startStub("food-service"),
      organization: await startStub("organization-service"),
      matcher: await startStub("matcher"),
      ai: await startStub("ai-service"),
    };
    process.env.AUTH_SERVICE_URL = stubs.auth.url;
    process.env.FOOD_SERVICE_URL = stubs.food.url;
    process.env.ORGANIZATION_SERVICE_URL = stubs.organization.url;
    process.env.MATCHER_URL = stubs.matcher.url;
    process.env.AI_SERVICE_URL = stubs.ai.url;
    gateway = await listen(createApp());
  });

  after(async () => {
    if (gateway) await gateway.close();
    if (stubs) {
      await Promise.all(Object.values(stubs).map((stub) => stub.close()));
    }
  });

  it("exposes a gateway health endpoint", async () => {
    const { status, body, headers } = await request(gateway.url, "GET", "/health");
    assert.equal(status, 200);
    assert.equal(body.data.service, "api-gateway");
    assert.ok(headers.get("x-request-id"));
    assert.equal(headers.get("x-content-type-options"), "nosniff");
  });

  it("forwards auth requests to the auth service", async () => {
    const { status, body } = await request(gateway.url, "POST", "/api/auth/register", {
      body: { email: "a@example.com" },
    });
    assert.equal(status, 200);
    assert.equal(body.service, "auth-service");
    assert.equal(body.path, "/auth/register");
  });

  it("forwards food requests to the food service", async () => {
    const { status, body } = await request(gateway.url, "GET", "/api/foods?category=Bakery", {
      token: signToken("Provider"),
    });
    assert.equal(status, 200);
    assert.equal(body.service, "food-service");
    assert.equal(body.path, "/foods/");
    assert.match(body.originalUrl, /^\/foods\/\?category=Bakery$/);
    assert.match(body.authorization, /^Bearer /);
    assert.equal(body.xUserId, "64b0f2c2c2c2c2c2c2c2c2c2");
    assert.equal(body.xUserRole, "Provider");
  });

  it("forwards organization requests to the organization service", async () => {
    const { status, body } = await request(gateway.url, "GET", "/api/organizations", {
      token: signToken("Admin"),
    });
    assert.equal(status, 200);
    assert.equal(body.service, "organization-service");
    assert.equal(body.originalUrl, "/organizations/");
  });

  it("forwards matcher requests to the Python matcher", async () => {
    const { status, body } = await request(gateway.url, "GET", "/api/matching/health");
    assert.equal(status, 200);
    assert.equal(body.service, "matcher");
    assert.equal(body.path, "/health");
  });

  it("forwards AI rag query requests to the AI service", async () => {
    const { status, body } = await request(gateway.url, "POST", "/api/ai/rag/query", {
      token: signToken("Provider"),
      body: { question: "What should we consider before redistributing prepared food?" },
    });
    assert.equal(status, 200);
    assert.equal(body.service, "ai-service");
    assert.equal(body.path, "/rag/query");
    assert.match(body.body.question, /prepared food/i);
  });

  it("forwards AI recommend requests to the AI service", async () => {
    const { status, body } = await request(gateway.url, "POST", "/api/ai/recommend", {
      token: signToken("Provider"),
      body: {
        surplusQuantity: 120,
        foodCategory: "Prepared Meals",
        timePattern: "7 PM - 9 PM",
        frequency: "weekly",
      },
    });
    assert.equal(status, 200);
    assert.equal(body.service, "ai-service");
    assert.equal(body.path, "/recommend");
    assert.equal(body.body.surplusQuantity, 120);
    assert.equal(body.body.foodCategory, "Prepared Meals");
  });

  it("forwards AI matching agent requests to the AI service", async () => {
    const { status, body } = await request(gateway.url, "POST", "/api/ai/agent", {
      token: signToken("Provider"),
      body: { message: "Find organizations that could use vegetarian meals" },
    });
    assert.equal(status, 200);
    assert.equal(body.service, "ai-service");
    assert.equal(body.path, "/agent");
    assert.match(body.body.message, /vegetarian meals/i);
  });

  it("requires authentication for food routes", async () => {
    const { status, body } = await request(gateway.url, "GET", "/api/foods");
    assert.equal(status, 401);
    assert.equal(body.success, false);
  });

  it("does not forward client-supplied identity headers on public auth routes", async () => {
    const { status, body } = await request(gateway.url, "POST", "/api/auth/login", {
      body: { email: "a@example.com" },
      headers: { "x-user-id": "spoofed-user", "x-user-role": "Admin" },
    });
    assert.equal(status, 200);
    assert.equal(body.xUserId, null);
    assert.equal(body.xUserRole, null);
  });

  it("propagates a correlation id to upstream services", async () => {
    const { status, body, headers } = await request(gateway.url, "POST", "/api/auth/login", {
      body: { email: "a@example.com" },
      headers: { "x-correlation-id": "corr-123" },
    });
    assert.equal(status, 200);
    assert.equal(body.correlationId, "corr-123");
    assert.equal(headers.get("x-correlation-id"), "corr-123");
  });

  it("returns 504 when an upstream service times out", async () => {
    const { status, body } = await request(gateway.url, "GET", "/api/matching/slow", {
      token: signToken("Organization"),
    });
    assert.equal(status, 504);
    assert.match(body.message, /timed out/i);
  });
});
