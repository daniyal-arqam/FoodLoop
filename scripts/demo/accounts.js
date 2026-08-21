const DEMO_ACCOUNTS = {
  provider: {
    name: "Ayesha Khan",
    email: "ayesha.provider@example.com",
    password: "Password1",
    role: "Provider",
  },
  organization: {
    name: "Karachi Food Bank",
    email: "kitchen.org@example.com",
    password: "Password1",
    role: "Organization",
  },
  shelter: {
    name: "Clifton Community Kitchen",
    email: "clifton.shelter@example.com",
    password: "Password1",
    role: "Organization",
  },
  admin: {
    name: "Loop Admin",
    email: "admin@foodloop.org",
    password: "AdminPass1",
    role: "Admin",
  },
};

const KARACHI = {
  latitude: 24.8607,
  longitude: 67.0011,
};

const DEMO_ORGANIZATIONS = {
  kitchen: {
    organizationName: "Karachi Food Bank",
    description: "Verified community kitchen for same-day prepared meals and bakery surplus.",
    address: "45 Relief Avenue, Karachi",
    location: { ...KARACHI },
    foodCategoriesNeeded: ["Prepared", "Bakery", "Produce"],
    requiredQuantity: 40,
  },
  shelter: {
    organizationName: "Clifton Community Kitchen",
    description: "Neighbourhood kitchen that takes bakery and produce for evening service.",
    address: "18 Clifton Block 5, Karachi",
    location: { latitude: 24.8138, longitude: 67.0224 },
    foodCategoriesNeeded: ["Bakery", "Produce"],
    requiredQuantity: 20,
  },
};

function hoursFromNow(hours, now = Date.now()) {
  return new Date(now + hours * 60 * 60 * 1000).toISOString();
}

function demoListingPayload(now = Date.now(), overrides = {}) {
  return {
    foodName: "Vegetarian meal",
    category: "Prepared",
    quantity: 30,
    unit: "servings",
    description: "Packed vegetarian trays for same-day rescue. Demo seed listing.",
    pickupLocation: {
      address: "12 Rescue Street, Karachi",
      latitude: KARACHI.latitude,
      longitude: KARACHI.longitude,
    },
    availableFrom: hoursFromNow(-1, now),
    availableUntil: hoursFromNow(8, now),
    expiryDate: hoursFromNow(6, now),
    ...overrides,
  };
}

function demoAgentListingPayload(now = Date.now()) {
  return demoListingPayload(now, {
    foodName: "Vegetarian meal trays",
    quantity: 24,
    description:
      "Second Available listing so the matching agent still has live food after the first listing is collected.",
  });
}

module.exports = {
  DEMO_ACCOUNTS,
  DEMO_ORGANIZATIONS,
  KARACHI,
  hoursFromNow,
  demoListingPayload,
  demoAgentListingPayload,
};
