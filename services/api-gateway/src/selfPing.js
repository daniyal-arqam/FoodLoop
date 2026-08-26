const MIN_MS = 30_000;
const MAX_MS = 60_000;
const DEFAULT_MS = 45_000;
const PING_TIMEOUT_MS = 15_000;

function parseInterval() {
  const raw = Number(process.env.KEEPALIVE_INTERVAL_MS || DEFAULT_MS);
  if (!Number.isFinite(raw)) return DEFAULT_MS;
  return Math.min(MAX_MS, Math.max(MIN_MS, raw));
}

function healthUrl(base, suffix = "/health") {
  const trimmed = String(base || "").trim().replace(/\/$/, "");
  if (!trimmed) return null;
  if (/\/health(\.json)?$/i.test(trimmed)) return trimmed;
  return `${trimmed}${suffix}`;
}

function collectUrls(config) {
  const selfBase = process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${config.port}`;
  const services = config.services || {};
  return [
    ...new Set(
      [
        healthUrl(selfBase),
        healthUrl(services.auth),
        healthUrl(services.food),
        healthUrl(services.organization),
        healthUrl(services.matcher),
        healthUrl(services.ai),
        healthUrl(process.env.KEEPALIVE_FRONTEND_URL, "/health.json"),
      ].filter(Boolean)
    ),
  ];
}

async function ping(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": "foodloop-self-ping" },
      signal: controller.signal,
    });
    console.log(`self-ping ${response.status} ${url}`);
  } catch (error) {
    const reason = error.name === "AbortError" ? "timeout" : error.message;
    console.log(`self-ping FAIL ${url} ${reason}`);
  } finally {
    clearTimeout(timer);
  }
}

function shouldRun() {
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.KEEPALIVE_ENABLED === "false") return false;
  if (process.env.KEEPALIVE_ENABLED === "true") return true;
  return process.env.NODE_ENV === "production";
}

function startSelfPing(config) {
  if (!shouldRun()) return () => {};

  const urls = collectUrls(config);
  if (!urls.length) return () => {};

  const intervalMs = parseInterval();
  console.log(`Self-ping every ${intervalMs}ms → ${urls.join(", ")}`);

  let inFlight = false;
  async function run() {
    if (inFlight) return;
    inFlight = true;
    try {
      await Promise.all(urls.map(ping));
    } finally {
      inFlight = false;
    }
  }

  run();
  const timer = setInterval(run, intervalMs);
  return () => clearInterval(timer);
}

module.exports = { startSelfPing, collectUrls, parseInterval };
