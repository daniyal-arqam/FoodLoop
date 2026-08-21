const { createProxy } = require("../services/proxyService");
const {
  authenticate,
  unless,
  isPublicAuthRoute,
  isPublicHealthRoute,
} = require("../middleware/authenticate");
const { loginRegisterLimiter } = require("../middleware/authRateLimit");
const config = require("../config");

function authProxy() {
  return [
    loginRegisterLimiter,
    unless(isPublicAuthRoute, authenticate),
    createProxy({ getTargetBaseUrl: () => config.services.auth, pathPrefix: "/auth" }),
  ];
}

function foodProxy() {
  return [
    authenticate,
    createProxy({ getTargetBaseUrl: () => config.services.food, pathPrefix: "/foods" }),
  ];
}

function organizationProxy() {
  return [
    authenticate,
    createProxy({ getTargetBaseUrl: () => config.services.organization, pathPrefix: "/organizations" }),
  ];
}

function matcherProxy() {
  return [
    unless(isPublicHealthRoute, authenticate),
    createProxy({ getTargetBaseUrl: () => config.services.matcher, pathPrefix: "" }),
  ];
}

function aiProxy() {
  return [
    unless(isPublicHealthRoute, authenticate),
    createProxy({
      getTargetBaseUrl: () => config.services.ai,
      pathPrefix: "",
      timeoutMs: config.aiProxyTimeoutMs,
    }),
  ];
}

module.exports = {
  authProxy,
  foodProxy,
  organizationProxy,
  matcherProxy,
  aiProxy,
};
