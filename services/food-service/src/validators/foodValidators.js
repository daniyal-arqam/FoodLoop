const AppError = require("../utils/AppError");
const { FOOD_CATEGORIES, FOOD_UNITS, FOOD_STATUS_VALUES } = require("../../../shared/constants");

function collectErrors(checks) {
  return checks.filter(Boolean);
}

function parseDate(value, field) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `${field} must be a valid date`;
  }
  return null;
}

function validatePickupLocation(location) {
  if (!location || typeof location !== "object") {
    return ["pickupLocation is required"];
  }
  return collectErrors([
    !location.address || String(location.address).trim().length < 3
      ? "pickupLocation.address must be at least 3 characters"
      : null,
    location.latitude == null || Number(location.latitude) < -90 || Number(location.latitude) > 90
      ? "pickupLocation.latitude must be between -90 and 90"
      : null,
    location.longitude == null ||
      Number(location.longitude) < -180 ||
      Number(location.longitude) > 180
      ? "pickupLocation.longitude must be between -180 and 180"
      : null,
  ]);
}

function validateCreate(req, _res, next) {
  const body = req.body || {};
  const errors = collectErrors([
    !body.foodName || String(body.foodName).trim().length < 2
      ? "foodName must be at least 2 characters"
      : null,
    !FOOD_CATEGORIES.includes(body.category) ? "category is invalid" : null,
    body.quantity == null || Number(body.quantity) <= 0 ? "quantity must be greater than 0" : null,
    !FOOD_UNITS.includes(body.unit) ? "unit is invalid" : null,
    parseDate(body.availableFrom, "availableFrom"),
    parseDate(body.availableUntil, "availableUntil"),
    parseDate(body.expiryDate, "expiryDate"),
    ...validatePickupLocation(body.pickupLocation),
  ]);

  if (errors.length) {
    return next(new AppError("Validation failed", 400, { errors }));
  }
  return next();
}

function validateUpdate(req, _res, next) {
  const body = req.body || {};
  if (!body || Object.keys(body).length === 0) {
    return next(new AppError("Validation failed", 400, { errors: ["At least one field is required"] }));
  }

  const errors = [];
  if (body.foodName !== undefined && String(body.foodName).trim().length < 2) {
    errors.push("foodName must be at least 2 characters");
  }
  if (body.category !== undefined && !FOOD_CATEGORIES.includes(body.category)) {
    errors.push("category is invalid");
  }
  if (body.quantity !== undefined && Number(body.quantity) <= 0) {
    errors.push("quantity must be greater than 0");
  }
  if (body.unit !== undefined && !FOOD_UNITS.includes(body.unit)) {
    errors.push("unit is invalid");
  }
  if (body.availableFrom !== undefined) {
    const invalid = parseDate(body.availableFrom, "availableFrom");
    if (invalid) errors.push(invalid);
  }
  if (body.availableUntil !== undefined) {
    const invalid = parseDate(body.availableUntil, "availableUntil");
    if (invalid) errors.push(invalid);
  }
  if (body.expiryDate !== undefined) {
    const invalid = parseDate(body.expiryDate, "expiryDate");
    if (invalid) errors.push(invalid);
  }
  if (body.pickupLocation !== undefined) {
    errors.push(...validatePickupLocation(body.pickupLocation));
  }
  if (body.status !== undefined && !FOOD_STATUS_VALUES.includes(body.status)) {
    errors.push("status is invalid");
  }

  if (errors.length) {
    return next(new AppError("Validation failed", 400, { errors }));
  }
  return next();
}

function validateClaim(req, _res, next) {
  if (req.body?.quantity != null && Number(req.body.quantity) <= 0) {
    return next(
      new AppError("Validation failed", 400, { errors: ["quantity must be greater than 0"] })
    );
  }
  return next();
}

function parseListQuery(req, _res, next) {
  const query = req.query || {};
  const errors = [];
  const filters = {
    category: query.category,
    status: query.status,
    mine: query.mine === "true",
    urgency: query.urgency === "true" || query.sort === "urgency",
  };

  if (query.minQuantity != null) {
    filters.minQuantity = Number(query.minQuantity);
    if (Number.isNaN(filters.minQuantity)) errors.push("minQuantity must be a number");
  }
  if (query.maxQuantity != null) {
    filters.maxQuantity = Number(query.maxQuantity);
    if (Number.isNaN(filters.maxQuantity)) errors.push("maxQuantity must be a number");
  }
  if (query.urgencyHours != null) {
    filters.urgencyHours = Number(query.urgencyHours);
    if (Number.isNaN(filters.urgencyHours) || filters.urgencyHours <= 0) {
      errors.push("urgencyHours must be a positive number");
    }
  }
  if (query.latitude != null || query.longitude != null) {
    filters.latitude = Number(query.latitude);
    filters.longitude = Number(query.longitude);
    if (Number.isNaN(filters.latitude) || Number.isNaN(filters.longitude)) {
      errors.push("latitude and longitude must be valid numbers");
    }
  }
  if (query.maxDistanceKm != null) {
    filters.maxDistanceKm = Number(query.maxDistanceKm);
    if (Number.isNaN(filters.maxDistanceKm) || filters.maxDistanceKm <= 0) {
      errors.push("maxDistanceKm must be a positive number");
    }
  }
  if (query.category && !FOOD_CATEGORIES.includes(query.category)) {
    errors.push("category is invalid");
  }
  if (query.status && !FOOD_STATUS_VALUES.includes(query.status)) {
    errors.push("status is invalid");
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
  validateClaim,
  parseListQuery,
};
