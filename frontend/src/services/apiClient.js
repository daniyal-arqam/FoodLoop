import { config } from "../config/env.js";
import { ApiError } from "../utils/errors.js";
import { clearAccessToken, getAccessToken } from "./tokenStore.js";

let unauthorizedHandler = null;

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

  const response = await fetch(`${config.apiBaseUrl}${path}${buildQuery(query)}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

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
