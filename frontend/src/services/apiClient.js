import { config } from "../config/env.js";
import { ApiError } from "../utils/errors.js";
import { clearAccessToken, getAccessToken } from "./tokenStore.js";

let unauthorizedHandler = null;
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const MAX_RETRIES = 3;

export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchOnce(url, init) {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError("Network error. Check your connection and try again.", 0);
  }
}

export async function apiRequest(
  path,
  { method = "GET", body, auth = true, query, skipUnauthorized = false } = {}
) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = auth ? getAccessToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${config.apiBaseUrl}${path}${buildQuery(query)}`;
  const init = {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  };

  let response;
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      response = await fetchOnce(url, init);
      if (!RETRYABLE_STATUS.has(response.status) || attempt === MAX_RETRIES) {
        break;
      }
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) {
        throw error;
      }
    }
    await sleep(1400 * attempt);
  }

  if (!response) {
    throw lastError || new ApiError("Network error. Check your connection and try again.", 0);
  }

  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401 && token && !skipUnauthorized) {
      clearAccessToken();
      unauthorizedHandler?.();
    }
    throw new ApiError(payload?.message || `Request failed (${response.status})`, response.status, payload?.data);
  }

  return payload;
}

export const apiClient = {
  get: (path, options) => apiRequest(path, { ...options, method: "GET" }),
  post: (path, body, options) => apiRequest(path, { ...options, method: "POST", body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: "PATCH", body }),
};
