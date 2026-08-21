import { describe, expect, it } from "vitest";
import { summarizeAdmin } from "./adminStats.js";

const listings = [
  { id: "1", foodName: "Bread", category: "Bakery", status: "Available", quantity: 10 },
  { id: "2", foodName: "Milk", category: "Dairy", status: "Reserved", quantity: 4, claimedQuantity: 4 },
  { id: "3", foodName: "Rice", category: "Other", status: "Collected", quantity: 9, claimedQuantity: 8 },
  { id: "4", foodName: "Salad", category: "Produce", status: "Expired", quantity: 2 },
];

const organizations = [
  { id: "o1", organizationName: "Kitchen", verified: true },
  { id: "o2", organizationName: "Shelter", verified: false },
];

const users = [
  { id: "u1", role: "Admin", isActive: true },
  { id: "u2", role: "Provider", isActive: true },
  { id: "u3", role: "Organization", isActive: false },
];

describe("summarizeAdmin", () => {
  it("derives dashboard metrics from live listings and organizations", () => {
    const stats = summarizeAdmin({ listings, organizations, users });
    expect(stats.totalListings).toBe(4);
    expect(stats.activeListings).toBe(1);
    expect(stats.foodRescued).toBe(8);
    expect(stats.byMonth).toEqual([]);
    expect(stats.verifiedOrganizations).toBe(1);
    expect(stats.expiredListings).toBe(1);
    expect(stats.claims).toBe(2);
    expect(stats.pendingOrganizations).toBe(1);
  });

  it("groups listings by UTC month", () => {
    const stats = summarizeAdmin({
      listings: [
        { status: "Available", quantity: 1, createdAt: "2026-07-02T00:00:00.000Z" },
        { status: "Collected", quantity: 2, claimedQuantity: 2, createdAt: "2026-08-11T00:00:00.000Z" },
        { status: "Expired", quantity: 1, createdAt: "2026-08-20T00:00:00.000Z" },
      ],
    });
    expect(stats.byMonth).toEqual([
      { label: "2026-07", value: 1 },
      { label: "2026-08", value: 2 },
    ]);
  });

  it("stays at zero when APIs return empty arrays", () => {
    expect(summarizeAdmin()).toMatchObject({
      totalListings: 0,
      activeListings: 0,
      foodRescued: 0,
      verifiedOrganizations: 0,
      expiredListings: 0,
      claims: 0,
    });
  });
});
