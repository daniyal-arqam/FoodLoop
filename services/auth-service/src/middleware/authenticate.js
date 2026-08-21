const User = require("../models/User");
const { verifyAccessToken } = require("../services/tokenService");
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

  const payload = verifyAccessToken(token);
  if (!payload.userId || !payload.role) {
    throw new AppError("Invalid token", 401);
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) {
    throw new AppError("Invalid or inactive account", 401);
  }

  req.user = {
    userId: user._id.toString(),
    role: user.role,
    user,
  };

  next();
});

module.exports = authenticate;
