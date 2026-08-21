const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { startMemoryMongo } = require("../../../shared/memoryMongo");
const Organization = require("../../src/models/Organization");
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
  await Organization.deleteMany({});
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

function profilePayload(overrides = {}) {
  return {
    organizationName: "Karachi Food Bank",
    description: "Community kitchen",
    address: "45 Relief Avenue, Karachi",
    location: {
      latitude: 24.8607,
      longitude: 67.0011,
    },
    foodCategoriesNeeded: ["Produce", "Bakery"],
    requiredQuantity: 50,
    ...overrides,
  };
}

module.exports = {
  signToken,
  startTestDatabase,
  startTestServer,
  resetData,
  request,
  profilePayload,
};
