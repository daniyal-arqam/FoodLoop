process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret-do-not-use-in-production";
process.env.JWT_EXPIRES_IN = "1h";

const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const createApp = require("../src/app");
const User = require("../src/models/User");
const { hashPassword } = require("../src/services/passwordService");
const {
  startTestDatabase,
  startTestServer,
  clearUsers,
  request,
} = require("./helpers/http");

const provider = {
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  password: "Password1",
  role: "Provider",
};

describe("auth-service HTTP", { concurrency: false }, () => {
  let memory;
  let server;

  before(async () => {
    memory = await startTestDatabase();
    await User.init();
    server = await startTestServer(createApp());
  });

  after(async () => {
    if (server) {
      await server.close();
    }
    if (memory) {
      await memory.stop();
    }
  });

  beforeEach(async () => {
    await clearUsers();
  });

  it("keeps GET /health available", async () => {
    const { status, body } = await request(server.url, "GET", "/health");
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.service, "auth-service");
    assert.equal(body.data.status, "ok");
  });

  it("registers a provider and returns a JWT without passwordHash", async () => {
    const { status, body } = await request(server.url, "POST", "/auth/register", {
      body: provider,
    });

    assert.equal(status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, provider.email);
    assert.equal(body.data.user.role, "Provider");
    assert.equal(body.data.user.passwordHash, undefined);
    assert.equal("password" in body.data.user, false);
    assert.equal(typeof body.data.accessToken, "string");

    const jwt = require("jsonwebtoken");
    const payload = jwt.decode(body.data.accessToken);
    assert.equal(payload.userId, body.data.user.id);
    assert.equal(payload.role, "Provider");
    assert.equal(payload.passwordHash, undefined);
  });

  it("rejects public Admin registration", async () => {
    const { status, body } = await request(server.url, "POST", "/auth/register", {
      body: { ...provider, email: "admin@example.com", role: "Admin" },
    });

    assert.equal(status, 403);
    assert.equal(body.success, false);
    assert.match(body.message, /Admin registration/i);
  });

  it("rejects a duplicate email", async () => {
    await request(server.url, "POST", "/auth/register", { body: provider });
    const { status, body } = await request(server.url, "POST", "/auth/register", {
      body: provider,
    });

    assert.equal(status, 409);
    assert.equal(body.success, false);
    assert.match(body.message, /already registered/i);
  });

  it("logs in with valid credentials", async () => {
    await request(server.url, "POST", "/auth/register", { body: provider });
    const { status, body } = await request(server.url, "POST", "/auth/login", {
      body: { email: provider.email, password: provider.password },
    });

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.user.email, provider.email);
    assert.equal(typeof body.data.accessToken, "string");
  });

  it("rejects an invalid password", async () => {
    await request(server.url, "POST", "/auth/register", { body: provider });
    const { status, body } = await request(server.url, "POST", "/auth/login", {
      body: { email: provider.email, password: "WrongPass1" },
    });

    assert.equal(status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid email or password");
  });

  it("registers an Organization with a JWT", async () => {
    const { status, body } = await request(server.url, "POST", "/auth/register", {
      body: {
        name: "Karachi Food Bank",
        email: "kitchen@example.com",
        password: "Password1",
        role: "Organization",
      },
    });
    assert.equal(status, 201);
    assert.equal(body.data.user.role, "Organization");
    assert.equal(typeof body.data.accessToken, "string");
  });

  it("rejects login for an unknown email", async () => {
    const { status, body } = await request(server.url, "POST", "/auth/login", {
      body: { email: "missing@example.com", password: "Password1" },
    });
    assert.equal(status, 401);
    assert.equal(body.message, "Invalid email or password");
  });

  it("rejects login for a deactivated account", async () => {
    await request(server.url, "POST", "/auth/register", { body: provider });
    await User.updateOne({ email: provider.email }, { $set: { isActive: false } });
    const { status, body } = await request(server.url, "POST", "/auth/login", {
      body: { email: provider.email, password: provider.password },
    });
    assert.equal(status, 403);
    assert.equal(body.message, "Account is disabled");
  });

  it("rejects an invalid JWT on a protected route", async () => {
    const malformed = await request(server.url, "GET", "/auth/me", {
      token: "not-a-jwt",
    });
    assert.equal(malformed.status, 401);

    const jwt = require("jsonwebtoken");
    const forged = jwt.sign({ userId: "64b0f2c2c2c2c2c2c2c2c2c2", role: "Admin" }, "wrong-secret");
    const tampered = await request(server.url, "GET", "/auth/me", { token: forged });
    assert.equal(tampered.status, 401);
  });

  it("rejects a protected endpoint without a token", async () => {
    const { status, body } = await request(server.url, "GET", "/auth/me");
    assert.equal(status, 401);
    assert.equal(body.success, false);
  });

  it("returns the current user on GET /auth/me", async () => {
    const registered = await request(server.url, "POST", "/auth/register", {
      body: provider,
    });
    const { status, body } = await request(server.url, "GET", "/auth/me", {
      token: registered.body.data.accessToken,
    });

    assert.equal(status, 200);
    assert.equal(body.data.user.email, provider.email);
    assert.equal(body.data.user.passwordHash, undefined);
  });

  it("enforces RBAC on the admin endpoint", async () => {
    const registered = await request(server.url, "POST", "/auth/register", {
      body: provider,
    });
    const forbidden = await request(server.url, "GET", "/auth/admin/me", {
      token: registered.body.data.accessToken,
    });
    assert.equal(forbidden.status, 403);

    await User.create({
      name: "Loop Admin",
      email: "admin@foodloop.org",
      passwordHash: await hashPassword("AdminPass1"),
      role: "Admin",
    });
    const adminLogin = await request(server.url, "POST", "/auth/login", {
      body: { email: "admin@foodloop.org", password: "AdminPass1" },
    });
    const allowed = await request(server.url, "GET", "/auth/admin/me", {
      token: adminLogin.body.data.accessToken,
    });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.data.user.role, "Admin");
  });

  it("lets an admin list users and deactivate another account", async () => {
    await request(server.url, "POST", "/auth/register", { body: provider });
    await User.create({
      name: "Loop Admin",
      email: "admin@foodloop.org",
      passwordHash: await hashPassword("AdminPass1"),
      role: "Admin",
    });
    const adminLogin = await request(server.url, "POST", "/auth/login", {
      body: { email: "admin@foodloop.org", password: "AdminPass1" },
    });
    const listed = await request(server.url, "GET", "/auth/admin/users", {
      token: adminLogin.body.data.accessToken,
    });
    assert.equal(listed.status, 200);
    assert.equal(listed.body.data.users.length, 2);
    assert.equal(
      listed.body.data.users.some((user) => user.passwordHash),
      false
    );

    const target = listed.body.data.users.find((user) => user.role === "Provider");
    const updated = await request(server.url, "PATCH", `/auth/admin/users/${target.id}`, {
      token: adminLogin.body.data.accessToken,
      body: { isActive: false },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.user.isActive, false);

    const self = await request(
      server.url,
      "PATCH",
      `/auth/admin/users/${adminLogin.body.data.user.id}`,
      {
        token: adminLogin.body.data.accessToken,
        body: { isActive: false },
      }
    );
    assert.equal(self.status, 400);
  });

  it("forbids non-admins from listing users", async () => {
    const registered = await request(server.url, "POST", "/auth/register", {
      body: provider,
    });
    const { status } = await request(server.url, "GET", "/auth/admin/users", {
      token: registered.body.data.accessToken,
    });
    assert.equal(status, 403);
  });

  it("logs out an authenticated user", async () => {
    const registered = await request(server.url, "POST", "/auth/register", {
      body: provider,
    });
    const { status, body } = await request(server.url, "POST", "/auth/logout", {
      token: registered.body.data.accessToken,
    });
    assert.equal(status, 200);
    assert.equal(body.success, true);
  });

  it("creates a provider from a verified Google profile", async () => {
    const { setGoogleTokenVerifier } = require("../src/services/googleAuth");
    setGoogleTokenVerifier(async () => ({
      email: "google.user@example.com",
      name: "Google User",
    }));
    const { status, body } = await request(server.url, "POST", "/auth/google", {
      body: { idToken: "a-valid-looking-google-id-token-value", role: "Provider" },
    });
    setGoogleTokenVerifier(null);
    assert.equal(status, 200);
    assert.equal(body.data.user.email, "google.user@example.com");
    assert.equal(body.data.user.role, "Provider");
    assert.equal(typeof body.data.accessToken, "string");
  });
});
