/**
 * Ping FoodLoop health URLs on a 30–60s loop (default 45s).
 * Optional GitHub Actions monitor for a live gateway URL.
 */
const MIN_MS = 30_000;
const MAX_MS = 60_000;
const DEFAULT_MS = 45_000;
const PING_TIMEOUT_MS = 20_000;

function parseInterval() {
  const raw = Number(process.env.KEEPALIVE_INTERVAL_MS || DEFAULT_MS);
  if (!Number.isFinite(raw)) return DEFAULT_MS;
  return Math.min(MAX_MS, Math.max(MIN_MS, raw));
}

function parseDuration() {
  const raw = Number(process.env.KEEPALIVE_DURATION_MS || 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw;
}

function healthUrl(base, { json = false } = {}) {
  const trimmed = String(base || "").trim().replace(/\/$/, "");
  if (!trimmed) return null;
  if (/\/health(\.json)?$/i.test(trimmed)) return trimmed;
  if (json || /\.vercel\.app$/i.test(trimmed)) return `${trimmed}/health.json`;
  return `${trimmed}/health`;
}

function collectUrls() {
  const fromList = (process.env.KEEPALIVE_URLS || "")
    .split(",")
    .map((part) => healthUrl(part))
    .filter(Boolean);

  const fromServices = [
    process.env.KEEPALIVE_GATEWAY_URL,
    process.env.KEEPALIVE_AUTH_URL,
    process.env.KEEPALIVE_FOOD_URL,
    process.env.KEEPALIVE_ORG_URL,
    process.env.KEEPALIVE_MATCHER_URL,
    process.env.KEEPALIVE_AI_URL,
  ]
    .map((part) => healthUrl(part))
    .filter(Boolean);

  const frontend = healthUrl(process.env.KEEPALIVE_FRONTEND_URL, { json: true });

  return [...new Set([...fromServices, ...fromList, frontend].filter(Boolean))];
}

async function ping(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": "foodloop-keepalive" },
      signal: controller.signal,
    });
    console.log(`${new Date().toISOString()}  ${response.status}  ${url}`);
  } catch (error) {
    const reason = error.name === "AbortError" ? "timeout" : error.message;
    console.log(`${new Date().toISOString()}  FAIL  ${url}  ${reason}`);
  } finally {
    clearTimeout(timer);
  }
}

async function tick(urls) {
  await Promise.all(urls.map(ping));
}

function startKeepalive({ urls = collectUrls(), intervalMs = parseInterval(), durationMs = parseDuration() } = {}) {
  if (!urls.length) {
    throw new Error("Set KEEPALIVE_GATEWAY_URL (and the other service URLs) or KEEPALIVE_URLS.");
  }

  console.log(`Keepalive every ${intervalMs}ms → ${urls.join(", ")}`);

  let inFlight = false;
  async function run() {
    if (inFlight) return;
    inFlight = true;
    try {
      await tick(urls);
    } finally {
      inFlight = false;
    }
  }

  run();
  const timer = setInterval(run, intervalMs);
  let doneTimer;

  function shutdown(code = 0) {
    clearInterval(timer);
    if (doneTimer) clearTimeout(doneTimer);
    process.exit(code);
  }

  if (durationMs) {
    doneTimer = setTimeout(() => shutdown(0), durationMs);
  }

  process.on("SIGTERM", () => shutdown(0));
  process.on("SIGINT", () => shutdown(0));

  return shutdown;
}

if (require.main === module) {
  try {
    startKeepalive();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { parseInterval, parseDuration, healthUrl, collectUrls, startKeepalive };
