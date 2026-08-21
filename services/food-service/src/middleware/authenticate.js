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

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret, { algorithms: ["HS256"] });
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  if (!payload.userId || !payload.role) {
    throw new AppError("Invalid token", 401);
  }

  req.user = {
    userId: payload.userId,
    role: payload.role,
  };

  next();
});

module.exports = authenticate;
