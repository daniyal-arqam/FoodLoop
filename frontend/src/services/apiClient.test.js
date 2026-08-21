import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiRequest } from "./apiClient.js";
import { ApiError } from "../utils/errors.js";

describe("apiRequest retries", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries a 502 and then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 502, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const pending = apiRequest("/health", { auth: false });
    await vi.runAllTimersAsync();
    const payload = await pending;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(payload.success).toBe(true);
  });

  it("surfaces 401 without retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/auth/me", { auth: false })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
