import { describe, expect, it } from "vitest";
import { distanceKm, formatDistance } from "./geo.js";

describe("distanceKm", () => {
  it("returns about 0 for the same point", () => {
    expect(distanceKm(24.86, 67, 24.86, 67)).toBeCloseTo(0, 5);
  });

  it("formats missing distance as an em dash", () => {
    expect(formatDistance(null)).toBe("—");
    expect(formatDistance(12.34)).toBe("12.3 km");
  });
});
