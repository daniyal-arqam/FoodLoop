import { distanceKm } from "./geo.js";
import { hoursUntil } from "./format.js";

export function formatProvider(providerId) {
  if (!providerId) return "—";
  return `Provider ${String(providerId).slice(-6)}`;
}

export function formatMatchScore(score) {
  if (score == null || Number.isNaN(Number(score))) return null;
  return Math.round(Number(score) * 100);
}

export function decorateListing(listing, organization, match = null) {
  const orgLat = organization?.location?.latitude;
  const orgLng = organization?.location?.longitude;
  const listingLat = listing.pickupLocation?.latitude;
  const listingLng = listing.pickupLocation?.longitude;
  const computedDistance =
    match?.distance_km ??
    distanceKm(orgLat, orgLng, listingLat, listingLng);

  return {
    ...listing,
    distanceKm: computedDistance == null ? null : Number(computedDistance),
    matchScore: match?.total_score ?? null,
    matchEligible: Boolean(match?.eligible),
    matchBreakdown: match?.breakdown || null,
    matchRejection: match?.rejection_reason || null,
    providerLabel: formatProvider(listing.providerId),
    hoursUntilExpiry: hoursUntil(listing.expiryDate),
  };
}

export function recommendedMatches(listings = []) {
  return listings
    .filter((item) => item.matchEligible && item.status === "Available")
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

export function listingsForOrganization(listings, organization) {
  if (!organization?.id) return [];
  return listings.filter((item) => item.reservedBy === organization.id);
}

export function recentActivity({ available = [], reserved = [], collected = [] }, limit = 8) {
  return [...available, ...reserved, ...collected]
    .map((item) => ({
      id: item.id,
      foodName: item.foodName,
      status: item.status,
      at: item.updatedAt || item.createdAt,
    }))
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .slice(0, limit);
}

export function summarizeOrganizationDashboard({ available, reserved, collected, recommended }) {
  return {
    availableCount: available.length,
    recommendedCount: recommended.length,
    activeClaims: reserved.length,
    collectedCount: collected.length,
    recent: recentActivity({ available, reserved, collected }),
  };
}

export function toFoodQuery(filters, organization) {
  const query = {};
  if (filters.category) query.category = filters.category;
  if (filters.minQuantity) query.minQuantity = Number(filters.minQuantity);
  if (filters.urgencyHours) {
    query.urgency = true;
    query.urgencyHours = Number(filters.urgencyHours);
  }
  const lat = organization?.location?.latitude;
  const lng = organization?.location?.longitude;
  if (filters.maxDistanceKm && lat != null && lng != null) {
    query.latitude = lat;
    query.longitude = lng;
    query.maxDistanceKm = Number(filters.maxDistanceKm);
  }
  return query;
}
