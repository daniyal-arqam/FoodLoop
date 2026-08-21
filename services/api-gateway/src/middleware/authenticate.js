const jwt = require("jsonwebtoken");
const config = require("../config");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = header.slice(7).trim();
  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret, { algorithms: ["HS256"] });
    if (!payload.userId || !payload.role) {
      throw new AppError("Invalid token", 401);
    }
    req.user = { userId: payload.userId, role: payload.role };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Invalid or expired token", 401);
  }

  next();
});

function unless(predicate, middleware) {
  return (req, res, next) => {
    if (predicate(req)) {
      return next();
    }
    return middleware(req, res, next);
  };
}

function isPublicAuthRoute(req) {
  return (
    (req.method === "POST" && req.path === "/register") ||
    (req.method === "POST" && req.path === "/login") ||
    (req.method === "POST" && req.path === "/google") ||
    (req.method === "GET" && req.path === "/google/config")
  );
}

function isPublicHealthRoute(req) {
  return req.method === "GET" && req.path === "/health";
}

module.exports = {
  authenticate,
  unless,
  isPublicAuthRoute,
  isPublicHealthRoute,
};
