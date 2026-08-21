import { apiClient } from "./apiClient.js";

export function listOrganizations(query) {
  return apiClient.get("/api/organizations", { query });
}

export function getOrganization(id) {
  return apiClient.get(`/api/organizations/${id}`);
}

export async function fetchOrganizations(query = {}) {
  const payload = await listOrganizations(query);
  return payload.data?.organizations || [];
}

export async function fetchOrganization(id) {
  const payload = await getOrganization(id);
  return payload.data?.organization || null;
}

export function createOrganization(payload) {
  return apiClient.post("/api/organizations", payload);
}

export function updateOrganizationProfile(payload) {
  return apiClient.patch("/api/organizations/profile", payload);
}

export function verifyOrganization(id, verified = true) {
  return apiClient.post(`/api/organizations/${id}/verify`, { verified });
}

export async function fetchMyOrganization() {
  try {
    const payload = await apiClient.get("/api/organizations/profile");
    return payload.data?.organization || null;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}
