import { apiClient } from "./apiClient.js";
import { listingToMatchInput, organizationToMatchInput } from "../utils/matching.js";
import { decorateListing } from "../utils/organizationFood.js";

export function scoreMatch(listing, organization) {
  return apiClient.post("/api/matching/score", { listing, organization });
}

export function estimateImpact(listings = []) {
  return apiClient.post("/api/matching/impact", {
    listings: listings.map((item) => ({
      quantity: item.quantity,
      claimedQuantity: item.claimedQuantity,
      status: item.status,
      category: item.category,
    })),
  });
}

export async function decorateWithMatchScores(listings, organization) {
  if (!organization || !listings.length) {
    return listings.map((listing) => decorateListing(listing, organization));
  }

  return Promise.all(
    listings.map(async (listing) => {
      const payload = await scoreMatch(
        listingToMatchInput(listing),
        organizationToMatchInput(organization)
      );
      return decorateListing(listing, organization, payload.data);
    })
  );
}
