import { apiClient } from "./apiClient.js";

export function listFoods(query) {
  return apiClient.get("/api/foods", { query });
}

export function getFood(id) {
  return apiClient.get(`/api/foods/${id}`);
}

export function createFood(payload) {
  return apiClient.post("/api/foods", payload);
}

export function updateFood(id, payload) {
  return apiClient.patch(`/api/foods/${id}`, payload);
}

export function claimFood(id, quantity) {
  return apiClient.post(`/api/foods/${id}/claim`, quantity == null ? {} : { quantity });
}

export function collectFood(id) {
  return apiClient.post(`/api/foods/${id}/collect`, {});
}

export async function fetchMyListings() {
  const payload = await listFoods({ mine: true });
  return payload.data?.listings || [];
}

export async function fetchListing(id) {
  const payload = await getFood(id);
  return payload.data?.listing || null;
}

export async function publishListing(body) {
  const payload = await createFood(body);
  return payload.data?.listing || null;
}

export async function fetchFoods(query = {}) {
  const payload = await listFoods(query);
  return payload.data?.listings || [];
}

export async function claimListing(id, quantity) {
  const payload = await claimFood(id, quantity);
  return payload.data;
}

export async function collectListing(id) {
  const payload = await collectFood(id);
  return payload.data;
}
