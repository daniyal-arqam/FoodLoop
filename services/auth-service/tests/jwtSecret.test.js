const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { resolveJwtSecret } = require("../../shared/jwtSecret");

describe("resolveJwtSecret", () => {
  it("rejects missing and placeholder secrets in production", () => {
    assert.throws(() => resolveJwtSecret({ env: "production", secret: "" }));
    assert.throws(() => resolveJwtSecret({ env: "production", secret: "change-me-in-local-env" }));
    assert.throws(() => resolveJwtSecret({ env: "production", secret: "replace-with-a-strong-jwt-secret" }));
  });

  it("accepts a non-placeholder production secret", () => {
    assert.equal(
      resolveJwtSecret({ env: "production", secret: "foodloop-local-dev-secret" }),
      "foodloop-local-dev-secret"
    );
  });

  it("uses the test fallback when unset", () => {
    assert.equal(resolveJwtSecret({ env: "test", secret: undefined }), "test-only-jwt-secret-do-not-use-in-production");
  });
});
