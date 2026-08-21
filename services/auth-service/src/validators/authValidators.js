const AppError = require("../utils/AppError");
const { PUBLIC_REGISTRATION_ROLES } = require("../../../shared/constants");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function collectErrors(checks) {
  return checks.filter(Boolean);
}

function validateRegister(req, _res, next) {
  const { name, email, password, role, phone } = req.body || {};

  if (role === "Admin") {
    return next(new AppError("Admin registration is not publicly available", 403));
  }

  const errors = collectErrors([
    !name || typeof name !== "string" || name.trim().length < 2
      ? "name must be at least 2 characters"
      : null,
    typeof name === "string" && name.trim().length > 100
      ? "name must be at most 100 characters"
      : null,
    !email || typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())
      ? "email must be a valid email address"
      : null,
    !password || typeof password !== "string" || password.length < 8
      ? "password must be at least 8 characters"
      : null,
    password && typeof password === "string" && password.length > 72
      ? "password must be at most 72 characters"
      : null,
    !role || !PUBLIC_REGISTRATION_ROLES.includes(role)
      ? "role must be Provider or Organization"
      : null,
    phone != null && phone !== "" && (typeof phone !== "string" || phone.length > 20)
      ? "phone must be at most 20 characters"
      : null,
  ]);

  if (errors.length) {
    return next(new AppError("Validation failed", 400, { errors }));
  }

  return next();
}

function validateLogin(req, _res, next) {
  const { email, password } = req.body || {};
  const errors = collectErrors([
    !email || typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())
      ? "email must be a valid email address"
      : null,
    !password || typeof password !== "string" || password.length < 1
      ? "password is required"
      : null,
  ]);

  if (errors.length) {
    return next(new AppError("Validation failed", 400, { errors }));
  }

  return next();
}

function validateGoogleLogin(req, _res, next) {
  const { idToken, role } = req.body || {};
  const errors = collectErrors([
    !idToken || typeof idToken !== "string" || idToken.trim().length < 20
      ? "idToken is required"
      : null,
    role != null && role !== "" && !PUBLIC_REGISTRATION_ROLES.includes(role)
      ? "role must be Provider or Organization"
      : null,
  ]);

  if (errors.length) {
    return next(new AppError("Validation failed", 400, { errors }));
  }

  return next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateGoogleLogin,
};
