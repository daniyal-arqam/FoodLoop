import { FOOD_STATUSES } from "./constants.js";

export function countByStatus(listings = [], status) {
  return listings.filter((item) => item.status === status).length;
}

export function portionsRescuedFrom(listings = []) {
  return listings
    .filter((item) => item.status === "Collected")
    .reduce((sum, item) => {
      const amount = Number(item.claimedQuantity ?? item.quantity ?? 0);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
}

export function recentListings(listings = [], limit = 5) {
  return [...listings]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit);
}

export function summarizeProviderListings(listings = []) {
  return {
    active: countByStatus(listings, "Available"),
    claimed: countByStatus(listings, "Reserved"),
    collected: countByStatus(listings, "Collected"),
    expired: countByStatus(listings, "Expired"),
    portionsRescued: portionsRescuedFrom(listings),
    recent: recentListings(listings),
    total: listings.length,
    statuses: FOOD_STATUSES,
  };
}
