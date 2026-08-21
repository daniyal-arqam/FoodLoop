const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const config = {
  apiBaseUrl,
  googleClientId,
  serviceName: "frontend",
};
