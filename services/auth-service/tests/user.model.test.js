const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const User = require("../src/models/User");

const VALID_HASH = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZabcde";

function validUser(overrides = {}) {
  return {
    name: "Ayesha Khan",
    email: "ayesha@example.com",
    passwordHash: VALID_HASH,
    role: "Provider",
    phone: "+923001112233",
    ...overrides,
  };
}

describe("User schema", () => {
  it("does not define a plaintext password field", () => {
    assert.equal(User.schema.path("password"), undefined);
    assert.ok(User.schema.path("passwordHash"));
    assert.equal(User.schema.path("passwordHash").options.select, false);
  });

  it("uses timestamps and unique email", () => {
    assert.equal(User.schema.get("timestamps"), true);
    assert.equal(User.schema.path("email").options.unique, true);
  });

  it("indexes role and isActive together", () => {
    const indexes = User.schema.indexes().map(([fields]) => fields);
    assert.ok(indexes.some((fields) => fields.role === 1 && fields.isActive === 1));
  });

  it("accepts a valid user", async () => {
    const user = new User(validUser());
    await user.validate();
    assert.equal(user.role, "Provider");
    assert.equal(user.isVerified, false);
    assert.equal(user.isActive, true);
    assert.equal(user.email, "ayesha@example.com");
  });

  it("lowercases and trims email", async () => {
    const user = new User(validUser({ email: "  Daniyal@FoodLoop.org  ", name: "Daniyal" }));
    await user.validate();
    assert.equal(user.email, "daniyal@foodloop.org");
  });

  it("rejects an invalid role", async () => {
    const user = new User(validUser({ role: "Volunteer" }));
    await assert.rejects(() => user.validate(), /invalid|enum/i);
  });

  it("rejects a plaintext passwordHash", async () => {
    const user = new User(validUser({ passwordHash: "secret123" }));
    await assert.rejects(() => user.validate(), /bcrypt hash/);
  });

  it("rejects an invalid email", async () => {
    const user = new User(validUser({ email: "not-an-email" }));
    await assert.rejects(() => user.validate(), /valid email/);
  });

  it("omits passwordHash from JSON", async () => {
    const user = new User(validUser());
    const serialized = user.toJSON();
    assert.equal(serialized.passwordHash, undefined);
  });
});

const runMongoPersistence = Boolean(
  process.env.RUN_MONGO_TESTS ||
    process.env.MONGODB_URI ||
    process.env.MONGOMS_SYSTEM_BINARY
);
const persistenceDescribe = runMongoPersistence ? describe : describe.skip;

persistenceDescribe("User persistence", { concurrency: false }, () => {
  let memory;

  before(async () => {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const { startMemoryMongo } = require("../../shared/memoryMongo");
    memory = await startMemoryMongo(mongoose, MongoMemoryServer);
    await User.init();
  });

  after(async () => {
    if (memory) {
      await memory.stop();
    }
  });

  it("saves timestamps and hides passwordHash by default", async () => {
    const created = await User.create(validUser({ email: "select@example.com" }));
    assert.ok(created.createdAt);
    assert.ok(created.updatedAt);
    const found = await User.findById(created._id);
    assert.equal(found.passwordHash, undefined);
    const withHash = await User.findById(created._id).select("+passwordHash");
    assert.equal(withHash.passwordHash, VALID_HASH);
  });

  it("enforces unique email", async () => {
    await User.create(validUser({ email: "unique@example.com" }));
    await assert.rejects(
      () => User.create(validUser({ email: "unique@example.com", name: "Other" })),
      (error) => error.code === 11000
    );
  });
});
