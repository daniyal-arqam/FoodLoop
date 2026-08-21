import { describe, expect, it } from "vitest";
import { ApiError } from "./errors.js";
import { claimErrorKind, claimErrorMessage } from "./claimErrors.js";

describe("claim errors", () => {
  it("maps unverified, reserved, and expired API failures", () => {
    expect(claimErrorKind(new ApiError("Organization must be verified before claiming", 403))).toBe(
      "unverified"
    );
    expect(claimErrorKind(new ApiError("Reserved listings cannot be claimed again", 409))).toBe(
      "reserved"
    );
    expect(claimErrorKind(new ApiError("Expired listings cannot be claimed", 409))).toBe("expired");
    expect(claimErrorMessage(new ApiError("Organization must be verified before claiming", 403))).toMatch(
      /verified organizations/
    );
  });
});
