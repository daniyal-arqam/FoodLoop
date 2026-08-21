const USER_ROLES = Object.freeze({
  PROVIDER: "Provider",
  ORGANIZATION: "Organization",
  ADMIN: "Admin",
});

const PUBLIC_REGISTRATION_ROLES = Object.freeze([
  USER_ROLES.PROVIDER,
  USER_ROLES.ORGANIZATION,
]);

const FOOD_STATUSES = Object.freeze({
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  COLLECTED: "Collected",
  EXPIRED: "Expired",
});

const CLAIM_STATUSES = Object.freeze({
  RESERVED: "Reserved",
  COLLECTED: "Collected",
  CANCELLED: "Cancelled",
});

const FOOD_CATEGORIES = Object.freeze([
  "Produce",
  "Bakery",
  "Dairy",
  "Prepared",
  "Canned",
  "Frozen",
  "Meat",
  "Other",
]);

const FOOD_UNITS = Object.freeze([
  "kg",
  "g",
  "L",
  "ml",
  "servings",
  "items",
  "boxes",
  "trays",
]);

module.exports = {
  USER_ROLES,
  USER_ROLE_VALUES: Object.values(USER_ROLES),
  PUBLIC_REGISTRATION_ROLES,
  FOOD_STATUSES,
  FOOD_STATUS_VALUES: Object.values(FOOD_STATUSES),
  CLAIM_STATUSES,
  CLAIM_STATUS_VALUES: Object.values(CLAIM_STATUSES),
  FOOD_CATEGORIES,
  FOOD_UNITS,
};
