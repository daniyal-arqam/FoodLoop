const AppError = require("../utils/AppError");
const { FOOD_CATEGORIES } = require("../../../shared/constants");

function collectErrors(checks) {
  return checks.filter(Boolean);
}

function validateLocation(location) {
  if (!location || typeof location !== "object") {
    return ["location is required"];
  }
  return collectErrors([
    location.latitude == null || Number(location.latitude) < -90 || Number(location.latitude) > 90
      ? "location.latitude must be between -90 and 90"
      : null,
    location.longitude == null ||
      Number(location.longitude) < -180 ||
      Number(location.longitude) > 180
      ? "location.longitude must be between -180 and 180"
      : null,
  ]);
}

function validateCategories(categories, required) {
  if (categories === undefined) {
    return required ? ["foodCategoriesNeeded is required"] : [];
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    return ["foodCategoriesNeeded must include at least one category"];
  }
  if (categories.some((item) => !FOOD_CATEGORIES.includes(item))) {
    return ["foodCategoriesNeeded contains an invalid category"];
  }
  return [];
}

function validateCreate(req, _res, next) {
  const body = req.body || {};
  const errors = collectErrors([
    !body.organizationName || String(body.organizationName).trim().length < 2
      ? "organizationName must be at least 2 characters"
      : null,
    !body.address || String(body.address).trim().length < 3
      ? "address must be at least 3 characters"
      : null,
    body.requiredQuantity == null || Number(body.requiredQuantity) < 0
      ? "requiredQuantity cannot be negative"
      : null,
    ...validateLocation(body.location),
    ...validateCategories(body.foodCategoriesNeeded, true),
  ]);

  if (errors.length) {
    return next(new AppError("Validation failed", 400, { errors }));
  }
  return next();
}

function validateUpdate(req, _res, next) {
  const body = req.body || {};
  const keys = Object.keys(body).filter((key) => key !== "verified" && key !== "userId");
  if (keys.length === 0) {
    return next(
      new AppError("Validation failed", 400, { errors: ["At least one updatable field is required"] })
    );
  }

  const errors = [];
  if (body.organizationName !== undefined && String(body.organizationName).trim().length < 2) {
    errors.push("organizationName must be at least 2 characters");
  }
  if (body.address !== undefined && String(body.address).trim().length < 3) {
    errors.push("address must be at least 3 characters");
  }
  if (body.requiredQuantity !== undefined && Number(body.requiredQuantity) < 0) {
    errors.push("requiredQuantity cannot be negative");
  }
  if (body.location !== undefined) {
    errors.push(...validateLocation(body.location));
  }
  if (body.foodCategoriesNeeded !== undefined) {
    errors.push(...validateCategories(body.foodCategoriesNeeded, false));
  }

  if (errors.length) {
    return next(new AppError("Validation failed", 400, { errors }));
  }
  return next();
}

function parseListQuery(req, _res, next) {
  const query = req.query || {};
  const errors = [];
  let q = query.q || query.name;
  if (Array.isArray(q)) {
    q = q[0];
  }
  if (q != null && String(q).length > 100) {
    errors.push("q must be at most 100 characters");
  }
  const filters = { q: q ? String(q) : undefined };

  if (query.category) {
    if (!FOOD_CATEGORIES.includes(query.category)) {
      errors.push("category is invalid");
    } else {
      filters.category = query.category;
    }
  }

  if (query.verified === "true") {
    filters.verified = true;
  } else if (query.verified === "false") {
    filters.verified = false;
  } else if (query.verified != null) {
    errors.push("verified must be true or false");
  }

  if (errors.length) {
    return next(new AppError("Validation failed", 400, { errors }));
  }

  req.listFilters = filters;
  return next();
}

module.exports = {
  validateCreate,
  validateUpdate,
  parseListQuery,
};
