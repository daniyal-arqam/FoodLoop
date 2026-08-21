import { countByStatus, portionsRescuedFrom } from "./listingStats.js";
import { USER_ROLES } from "./constants.js";

function tally(items = [], getKey) {
  const counts = new Map();
  for (const item of items) {
    const key = getKey(item) || "Unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value }));
}

export function listingsByMonth(listings = []) {
  const counts = new Map();
  for (const item of listings) {
    const date = new Date(item.createdAt || item.updatedAt || 0);
    if (Number.isNaN(date.getTime()) || date.getTime() === 0) continue;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, value }));
}

export function summarizeAdmin({ listings = [], organizations = [], users = [] } = {}) {
  const reserved = countByStatus(listings, "Reserved");
  const collected = countByStatus(listings, "Collected");
  const available = countByStatus(listings, "Available");
  const expired = countByStatus(listings, "Expired");

  return {
    totalListings: listings.length,
    activeListings: available,
    foodRescued: portionsRescuedFrom(listings),
    verifiedOrganizations: organizations.filter((item) => item.verified).length,
    pendingOrganizations: organizations.filter((item) => !item.verified).length,
    expiredListings: expired,
    claims: reserved + collected,
    totalOrganizations: organizations.length,
    totalUsers: users.length,
    activeUsers: users.filter((item) => item.isActive !== false).length,
    byStatus: [
      { label: "Available", value: available },
      { label: "Reserved", value: reserved },
      { label: "Collected", value: collected },
      { label: "Expired", value: expired },
    ],
    byCategory: tally(listings, (item) => item.category),
    byMonth: listingsByMonth(listings),
    byRole: Object.values(USER_ROLES).map((role) => ({
      label: role,
      value: users.filter((item) => item.role === role).length,
    })),
  };
}
