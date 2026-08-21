import { apiClient } from "./apiClient.js";

export function recommendWasteReduction(payload) {
  return apiClient.post("/api/ai/recommend", payload);
}

export function queryKnowledgeBase(question) {
  return apiClient.post("/api/ai/rag/query", { question });
}

export function runMatchingAgent(message) {
  return apiClient.post("/api/ai/agent", { message });
}
