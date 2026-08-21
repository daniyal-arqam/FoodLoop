import { afterEach, describe, expect, it } from "vitest";
import { TOKEN_STORAGE_KEY } from "../utils/constants.js";
import { clearAccessToken, getAccessToken, resetTokenStore, setAccessToken } from "./tokenStore.js";

describe("tokenStore", () => {
  afterEach(() => {
    resetTokenStore();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("keeps the access token in memory and sessionStorage, not localStorage", () => {
    setAccessToken("jwt-token");
    expect(getAccessToken()).toBe("jwt-token");
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBe("jwt-token");
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("clears the token on logout", () => {
    setAccessToken("jwt-token");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("migrates a leftover localStorage token into sessionStorage", () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "legacy-token");
    expect(getAccessToken()).toBe("legacy-token");
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBe("legacy-token");
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
