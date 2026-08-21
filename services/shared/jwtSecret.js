const WEAK_PRODUCTION_SECRETS = new Set([
  "change-me-in-local-env",
  "replace-with-a-strong-jwt-secret",
]);

function resolveJwtSecret({
  env = process.env.NODE_ENV || "development",
  secret = process.env.JWT_SECRET,
} = {}) {
  if (env === "production") {
    if (!secret || WEAK_PRODUCTION_SECRETS.has(secret)) {
      throw new Error("JWT_SECRET must be set to a strong value in production");
    }
    return secret;
  }

  if (env === "test") {
    return secret || "test-only-jwt-secret-do-not-use-in-production";
  }

  return secret || "change-me-in-local-env";
}

module.exports = { resolveJwtSecret, WEAK_PRODUCTION_SECRETS };
