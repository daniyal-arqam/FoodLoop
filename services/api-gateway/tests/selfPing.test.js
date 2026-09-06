process.env.NODE_ENV = "test";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { collectUrls, parseInterval, startSelfPing } = require("../src/selfPing");

describe("selfPing", () => {
  it("clamps the interval to 30–60 seconds", () => {
    process.env.KEEPALIVE_INTERVAL_MS = "1000";
    assert.equal(parseInterval(), 30_000);
    process.env.KEEPALIVE_INTERVAL_MS = "120000";
    assert.equal(parseInterval(), 60_000);
    delete process.env.KEEPALIVE_INTERVAL_MS;
    assert.equal(parseInterval(), 45_000);
  });

  it("builds /health URLs from the gateway config", () => {
    delete process.env.RENDER_EXTERNAL_URL;
    delete process.env.KEEPALIVE_FRONTEND_URL;
    const urls = collectUrls({
      port: 8080,
      services: {
        auth: "https://auth.example.com",
        food: "http://localhost:4002",
        organization: "",
        matcher: "http://localhost:8001/",
        ai: "http://localhost:8002/health",
      },
    });
    assert.deepEqual(
      urls.filter((url) => url.includes("auth.example") || url.includes("127.0.0.1") || url.endsWith("/health")),
      [
        "http://127.0.0.1:8080/health",
        "https://auth.example.com/health",
        "http://localhost:4002/health",
        "http://localhost:8001/health",
        "http://localhost:8002/health",
      ]
    );
  });

  it("does not start a timer in test", () => {
    const stop = startSelfPing({ port: 8080, services: {} });
    stop();
  });
});
