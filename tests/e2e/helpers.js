process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-only-jwt-secret-do-not-use-in-production";
process.env.JWT_EXPIRES_IN = "1h";
process.env.PROXY_TIMEOUT_MS = "20000";

const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { MongoMemoryServer } = require("../../services/food-service/node_modules/mongodb-memory-server");

const createAuthApp = require("../../services/auth-service/src/app");
const authDatabase = require("../../services/auth-service/src/config/database");
const User = require("../../services/auth-service/src/models/User");
const { hashPassword } = require("../../services/auth-service/src/services/passwordService");

const createFoodApp = require("../../services/food-service/src/app");
const foodDatabase = require("../../services/food-service/src/config/database");
const FoodListing = require("../../services/food-service/src/models/FoodListing");
const Claim = require("../../services/food-service/src/models/Claim");

const createOrganizationApp = require("../../services/organization-service/src/app");
const organizationDatabase = require("../../services/organization-service/src/config/database");
const Organization = require("../../services/organization-service/src/models/Organization");

const createGatewayApp = require("../../services/api-gateway/src/app");

const ROOT = path.resolve(__dirname, "../..");
const MATCHER_ROOT = path.join(ROOT, "python-services", "matcher");
const AI_ROOT = path.join(ROOT, "ai-service");

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitFor(fn, { timeoutMs = 25000, intervalMs = 200 } = {}) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  throw lastError || new Error("Timed out waiting for service");
}

async function listen(app) {
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
  const payload = await response.json().catch(() => null);
  return { status: response.status, body: payload };
}

function pythonIn(dir) {
  const windows = path.join(dir, ".venv", "Scripts", "python.exe");
  const unix = path.join(dir, ".venv", "bin", "python");
  if (fs.existsSync(windows)) return windows;
  if (fs.existsSync(unix)) return unix;
  throw new Error(`Virtualenv is missing in ${dir}. Run ./scripts/setup.sh first.`);
}

function matcherPython() {
  return pythonIn(MATCHER_ROOT);
}

async function startMatcher() {
  const port = await getFreePort();
  const python = matcherPython();
  const child = spawn(python, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: MATCHER_ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const url = `http://127.0.0.1:${port}`;
  try {
    await waitFor(async () => {
      if (child.exitCode != null) {
        throw new Error(`Matcher exited early (${child.exitCode}): ${stderr}`);
      }
      const response = await fetch(`${url}/health`);
      if (!response.ok) {
        throw new Error(`Matcher health ${response.status}`);
      }
      return true;
    });
  } catch (error) {
    child.kill();
    throw error;
  }

  return {
    url,
    async close() {
      if (child.exitCode != null) return;
      child.kill();
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 2000);
        child.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    },
  };
}

async function startAi() {
  const indexPath = path.join(AI_ROOT, "data", "rag", "index.faiss");
  const python = pythonIn(AI_ROOT);
  if (!fs.existsSync(indexPath)) {
    await new Promise((resolve, reject) => {
      const ingest = spawn(python, [path.join("scripts", "ingest.py")], {
        cwd: AI_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
      let stderr = "";
      ingest.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      ingest.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`RAG ingest failed: ${stderr}`))
      );
    });
  }

  const port = await getFreePort();
  const child = spawn(python, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: AI_ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      OPENAI_API_KEY: "",
      AI_API_KEY: "",
      FOOD_SERVICE_URL: process.env.FOOD_SERVICE_URL,
      ORGANIZATION_SERVICE_URL: process.env.ORGANIZATION_SERVICE_URL,
      MATCHER_URL: process.env.MATCHER_URL,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const url = `http://127.0.0.1:${port}`;
  try {
    await waitFor(async () => {
      if (child.exitCode != null) {
        throw new Error(`AI service exited early (${child.exitCode}): ${stderr}`);
      }
      const response = await fetch(`${url}/health`);
      if (!response.ok) {
        throw new Error(`AI health ${response.status}`);
      }
      return true;
    });
  } catch (error) {
    child.kill();
    throw error;
  }

  return {
    url,
    async close() {
      if (child.exitCode != null) return;
      child.kill();
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 2000);
        child.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    },
  };
}

function listingToMatchInput(listing) {
  return {
    id: listing.id,
    foodName: listing.foodName,
    category: listing.category,
    quantity: listing.quantity,
    latitude: listing.pickupLocation.latitude,
    longitude: listing.pickupLocation.longitude,
    expiryDate: listing.expiryDate,
    status: listing.status,
  };
}

function organizationToMatchInput(organization) {
  return {
    id: organization.id,
    organizationName: organization.organizationName,
    verified: organization.verified,
    latitude: organization.location.latitude,
    longitude: organization.location.longitude,
    foodCategoriesNeeded: organization.foodCategoriesNeeded,
    requiredQuantity: organization.requiredQuantity,
  };
}

async function startStack() {
  const mongod = await MongoMemoryServer.create({
    binary: process.env.MONGOMS_SYSTEM_BINARY
      ? { systemBinary: process.env.MONGOMS_SYSTEM_BINARY }
      : { version: process.env.MONGOMS_VERSION || "7.0.14" },
  });
  const mongoUri = mongod.getUri();
  process.env.MONGODB_URI = mongoUri;

  await authDatabase.connectDatabase(mongoUri);
  await foodDatabase.connectDatabase(mongoUri);
  await organizationDatabase.connectDatabase(mongoUri);
  await User.init();
  await FoodListing.init();
  await Claim.init();
  await Organization.init();

  const auth = await listen(createAuthApp());
  const food = await listen(createFoodApp());
  const organization = await listen(createOrganizationApp());
  const matcher = await startMatcher();

  process.env.AUTH_SERVICE_URL = auth.url;
  process.env.FOOD_SERVICE_URL = food.url;
  process.env.ORGANIZATION_SERVICE_URL = organization.url;
  process.env.MATCHER_URL = matcher.url;
  process.env.AI_SERVICE_URL = matcher.url;

  const gateway = await listen(createGatewayApp());

  await User.create({
    name: "Loop Admin",
    email: "admin@foodloop.org",
    passwordHash: await hashPassword("AdminPass1"),
    role: "Admin",
  });

  return {
    gateway,
    async close() {
      await gateway.close();
      await matcher.close();
      await Promise.all([auth.close(), food.close(), organization.close()]);
      await authDatabase.disconnectDatabase();
      await foodDatabase.disconnectDatabase();
      await organizationDatabase.disconnectDatabase();
      await mongod.stop();
    },
  };
}

module.exports = {
  hoursFromNow,
  request,
  startStack,
  startAi,
  listingToMatchInput,
  organizationToMatchInput,
};
