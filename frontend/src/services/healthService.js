import { config } from "../config/env.js";
import { apiClient } from "./apiClient.js";

export async function getFrontendHealth() {
  const response = await fetch("/health.json");
  if (!response.ok) {
    throw new Error(`Health check failed (${response.status})`);
  }
  return response.json();
}

export function getGatewayHealth() {
  return apiClient.get("/health", { auth: false });
}

export { config };
