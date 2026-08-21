process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret-do-not-use-in-production";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const authorize = require("../src/middleware/authorize");
const authenticate = require("../src/middleware/authenticate");
const { signAccessToken } = require("../src/services/tokenService");
const { hashPassword, comparePassword } = require("../src/services/passwordService");
const { validateRegister, validateLogin } = require("../src/validators/authValidators");

function nextCapture() {
  let error;
  const next = (err) => {
    error = err;
  };
  return {
    next,
    get error() {
      return error;
    },
  };
}

describe("authorize middleware", () => {
  it("allows an included role", () => {
    const captured = nextCapture();
    authorize("Provider")({ user: { role: "Provider" } }, {}, captured.next);
    assert.equal(captured.error, undefined);
  });

  it("rejects a role that is not allowed", () => {
    const captured = nextCapture();
    authorize("Admin")({ user: { role: "Provider" } }, {}, captured.next);
    assert.equal(captured.error.statusCode, 403);
    assert.equal(captured.error.message, "Forbidden");
  });

  it("rejects a missing authenticated user", () => {
    const captured = nextCapture();
    authorize("Provider")({}, {}, captured.next);
    assert.equal(captured.error.statusCode, 401);
  });
});

describe("validators", () => {
  it("rejects incomplete registration", () => {
    const captured = nextCapture();
    validateRegister({ body: { email: "bad", password: "short" } }, {}, captured.next);
    assert.equal(captured.error.statusCode, 400);
    assert.equal(captured.error.message, "Validation failed");
    assert.ok(Array.isArray(captured.error.data.errors));
  });

  it("rejects public Admin registration", () => {
    const captured = nextCapture();
    validateRegister(
      {
        body: {
          name: "Admin",
          email: "admin@example.com",
          password: "Password1",
          role: "Admin",
        },
      },
      {},
      captured.next
    );
    assert.equal(captured.error.statusCode, 403);
    assert.match(captured.error.message, /Admin registration/i);
  });

  it("accepts a valid login payload", () => {
    const captured = nextCapture();
    validateLogin(
      { body: { email: "user@example.com", password: "Password1" } },
      {},
      captured.next
    );
    assert.equal(captured.error, undefined);
  });
});

describe("password and JWT utils", () => {
  it("hashes with bcrypt and verifies the password", async () => {
    const hash = await hashPassword("Password1");
    assert.match(hash, /^\$2[aby]\$/);
    assert.equal(await comparePassword("Password1", hash), true);
    assert.equal(await comparePassword("other", hash), false);
  });

  it("signs a JWT containing userId and role only", () => {
    const token = signAccessToken({
      _id: new mongoose.Types.ObjectId("64b0f2c2c2c2c2c2c2c2c2c2"),
      role: "Organization",
    });
    const jwt = require("jsonwebtoken");
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(payload.userId, "64b0f2c2c2c2c2c2c2c2c2c2");
    assert.equal(payload.role, "Organization");
    assert.equal(payload.passwordHash, undefined);
  });

  it("rejects unsigned JWT tokens that claim alg none", () => {
    const jwt = require("jsonwebtoken");
    const { verifyAccessToken } = require("../src/services/tokenService");
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ userId: "64b0f2c2c2c2c2c2c2c2c2c2", role: "Admin" })
    ).toString("base64url");
    assert.throws(() => verifyAccessToken(`${header}.${payload}.`), (err) => err.statusCode === 401);
    const hs256 = jwt.sign(
      { userId: "64b0f2c2c2c2c2c2c2c2c2c2", role: "Admin" },
      process.env.JWT_SECRET,
      { algorithm: "HS256" }
    );
    const decoded = verifyAccessToken(hs256);
    assert.equal(decoded.role, "Admin");
  });
});

describe("authenticate middleware", () => {
  it("rejects a missing Authorization header", async () => {
    const captured = nextCapture();
    await authenticate({ headers: {} }, {}, captured.next);
    assert.equal(captured.error.statusCode, 401);
  });
});
