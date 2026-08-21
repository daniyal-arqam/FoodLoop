const config = require("../config");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

const UNOVERWRITABLE_IDENTITY = new Set(["x-user-id", "x-user-role"]);

function buildTargetUrl(targetBaseUrl, pathPrefix, incomingUrl) {
  const suffix = incomingUrl.startsWith("/") ? incomingUrl : `/${incomingUrl}`;
  const prefix = pathPrefix.endsWith("/") ? pathPrefix.slice(0, -1) : pathPrefix;
  return new URL(`${prefix}${suffix}`, `${targetBaseUrl.replace(/\/$/, "")}/`);
}

function outboundHeaders(req) {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (!value || HOP_BY_HOP.has(lower) || UNOVERWRITABLE_IDENTITY.has(lower)) {
      continue;
    }
    headers[key] = value;
  }
  headers["x-request-id"] = req.correlationId;
  headers["x-correlation-id"] = req.correlationId;
  if (req.user) {
    headers["x-user-id"] = req.user.userId;
    headers["x-user-role"] = req.user.role;
  }
  return headers;
}

function createProxy({ getTargetBaseUrl, pathPrefix = "", timeoutMs }) {
  return asyncHandler(async (req, res) => {
    const targetBaseUrl = getTargetBaseUrl();
    const target = buildTargetUrl(targetBaseUrl, pathPrefix, req.url);
    const method = req.method.toUpperCase();
    const headers = outboundHeaders(req);
    const timeout = timeoutMs || config.proxyTimeoutMs;

    const init = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout),
    };

    if (!["GET", "HEAD"].includes(method)) {
      headers["content-type"] = headers["content-type"] || "application/json";
      init.body = JSON.stringify(req.body ?? {});
    }

    let upstream;
    try {
      upstream = await fetch(target, init);
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "AbortError" || error.code === "ABORT_ERR") {
        throw new AppError("Upstream service timed out", 504);
      }
      throw new AppError("Upstream service unavailable", 502);
    }

    const contentType = upstream.headers.get("content-type") || "application/json";
    const payload = await upstream.text();

    res.status(upstream.status);
    res.setHeader("content-type", contentType);
    if (req.correlationId) {
      res.setHeader("x-request-id", req.correlationId);
      res.setHeader("x-correlation-id", req.correlationId);
    }

    if (!payload) {
      return res.end();
    }

    return res.send(payload);
  });
}

module.exports = { createProxy, buildTargetUrl };
