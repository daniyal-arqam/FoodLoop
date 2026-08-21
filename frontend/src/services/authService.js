import { apiClient } from "./apiClient.js";

export function registerAccount({ name, email, password, role }) {
  return apiClient.post("/api/auth/register", { name, email, password, role }, { auth: false });
}

export function loginAccount({ email, password }) {
  return apiClient.post("/api/auth/login", { email, password }, { auth: false });
}

export function fetchCurrentUser() {
  return apiClient.get("/api/auth/me", { skipUnauthorized: true });
}

export function logoutAccount() {
  return apiClient.post("/api/auth/logout", {});
}

export async function fetchAdminUsers() {
  const payload = await apiClient.get("/api/auth/admin/users");
  return payload.data?.users || [];
}

export async function setAdminUserActive(id, isActive) {
  const payload = await apiClient.patch(`/api/auth/admin/users/${id}`, { isActive });
  return payload.data?.user || null;
}
