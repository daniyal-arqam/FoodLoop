const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { startMemoryMongo } = require("../../../shared/memoryMongo");
const FoodListing = require("../../src/models/FoodListing");
const Claim = require("../../src/models/Claim");
const OrganizationLookup = require("../../src/models/OrganizationLookup");
const config = require("../../src/config");

function signToken(userId, role) {
  return jwt.sign({ userId, role }, config.jwt.secret, { expiresIn: "1h" });
}

async function startTestDatabase() {
  return startMemoryMongo(mongoose, MongoMemoryServer);
}

async function startTestServer(app) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

async function resetData() {
  await Claim.deleteMany({});
  await FoodListing.deleteMany({});
  await OrganizationLookup.deleteMany({});
}

async function request(baseUrl, method, pathname, { token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();
  return { status: response.status, body: payload };
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function listingPayload(overrides = {}) {
  return {
    foodName: "Fresh bread",
    category: "Bakery",
    quantity: 20,
    unit: "items",
    description: "Day-old loaves",
    pickupLocation: {
      address: "12 Rescue Street, Karachi",
      latitude: 24.8607,
      longitude: 67.0011,
    },
    availableFrom: hoursFromNow(1),
    availableUntil: hoursFromNow(8),
    expiryDate: hoursFromNow(12),
    ...overrides,
  };
}

module.exports = {
  signToken,
  startTestDatabase,
  startTestServer,
  resetData,
  request,
  hoursFromNow,
  listingPayload,
};
