import { describe, expect, it } from "vitest";
import {
  decorateListing,
  recommendedMatches,
  summarizeOrganizationDashboard,
  toFoodQuery,
} from "./organizationFood.js";

const organization = {
  id: "org-1",
  verified: true,
  location: { latitude: 24.86, longitude: 67 },
};

describe("organization food helpers", () => {
  it("attaches distance, provider, and match score from backend data", () => {
    const listing = decorateListing(
      {
        id: "food-1",
        foodName: "Bread",
        category: "Bakery",
        quantity: 10,
        unit: "kg",
        status: "Available",
        providerId: "provider-abc123",
        pickupLocation: { latitude: 24.86, longitude: 67, address: "Clifton" },
        expiryDate: "2026-08-22T00:00:00.000Z",
      },
      organization,
      { total_score: 0.82, distance_km: 1.4, eligible: true, breakdown: { distance: 0.9, quantity: 0.8, category: 1, urgency: 0.7 } }
    );

    expect(listing.distanceKm).toBe(1.4);
    expect(listing.matchBreakdown).toEqual({
      distance: 0.9,
      quantity: 0.8,
      category: 1,
      urgency: 0.7,
    });
    expect(listing.matchScore).toBe(0.82);
    expect(listing.matchEligible).toBe(true);
    expect(listing.providerLabel).toMatch(/abc123/);
  });

  it("keeps recommended matches as eligible available listings only", () => {
    const recommended = recommendedMatches([
      { id: "1", status: "Available", matchEligible: true, matchScore: 0.2 },
      { id: "2", status: "Available", matchEligible: true, matchScore: 0.9 },
      { id: "3", status: "Reserved", matchEligible: true, matchScore: 0.99 },
      { id: "4", status: "Available", matchEligible: false, matchScore: 0 },
    ]);
    expect(recommended.map((item) => item.id)).toEqual(["2", "1"]);
  });

  it("summarizes dashboard counts from real listing arrays", () => {
    const stats = summarizeOrganizationDashboard({
      available: [{ id: "a" }, { id: "b" }],
      reserved: [{ id: "c" }],
      collected: [{ id: "d" }, { id: "e" }],
      recommended: [{ id: "b" }],
    });
    expect(stats.availableCount).toBe(2);
    expect(stats.recommendedCount).toBe(1);
    expect(stats.activeClaims).toBe(1);
    expect(stats.collectedCount).toBe(2);
  });

  it("maps discovery filters onto food-service query params", () => {
    expect(
      toFoodQuery(
        { category: "Dairy", minQuantity: "5", maxDistanceKm: "10", urgencyHours: "24" },
        organization
      )
    ).toEqual({
      category: "Dairy",
      minQuantity: 5,
      urgency: true,
      urgencyHours: 24,
      latitude: 24.86,
      longitude: 67,
      maxDistanceKm: 10,
    });
  });
});
