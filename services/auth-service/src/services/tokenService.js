const jwt = require("jsonwebtoken");
const config = require("../config");
const AppError = require("../utils/AppError");

function signAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn, algorithm: "HS256" }
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret, { algorithms: ["HS256"] });
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
}

module.exports = { signAccessToken, verifyAccessToken };
