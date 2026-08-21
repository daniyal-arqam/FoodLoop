const http = require("http");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { startMemoryMongo } = require("../../../shared/memoryMongo");
const User = require("../../src/models/User");

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

async function startTestDatabase() {
  return startMemoryMongo(mongoose, MongoMemoryServer);
}

async function clearUsers() {
  await User.deleteMany({});
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

module.exports = {
  startTestServer,
  startTestDatabase,
  clearUsers,
  request,
};
