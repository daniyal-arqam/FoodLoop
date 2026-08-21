import { describe, expect, it } from "vitest";
import { summarizeProviderListings } from "./listingStats.js";

const listings = [
  {
    id: "1",
    foodName: "Bread",
    status: "Available",
    quantity: 10,
    claimedQuantity: 0,
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "2",
    foodName: "Milk",
    status: "Reserved",
    quantity: 6,
    claimedQuantity: 6,
    createdAt: "2026-08-19T10:00:00.000Z",
  },
  {
    id: "3",
    foodName: "Rice",
    status: "Collected",
    quantity: 8,
    claimedQuantity: 8,
    createdAt: "2026-08-21T10:00:00.000Z",
  },
  {
    id: "4",
    foodName: "Salad",
    status: "Expired",
    quantity: 2,
    claimedQuantity: 0,
    createdAt: "2026-08-18T10:00:00.000Z",
  },
];

describe("summarizeProviderListings", () => {
  it("counts live statuses and rescued portions from backend listings", () => {
    const stats = summarizeProviderListings(listings);
    expect(stats.active).toBe(1);
    expect(stats.claimed).toBe(1);
    expect(stats.collected).toBe(1);
    expect(stats.expired).toBe(1);
    expect(stats.portionsRescued).toBe(8);
    expect(stats.recent.map((item) => item.foodName)).toEqual(["Rice", "Bread", "Milk", "Salad"]);
  });

  it("stays at zero when the API returns no listings", () => {
    const stats = summarizeProviderListings([]);
    expect(stats).toMatchObject({
      active: 0,
      claimed: 0,
      collected: 0,
      expired: 0,
      portionsRescued: 0,
      recent: [],
    });
  });
});
