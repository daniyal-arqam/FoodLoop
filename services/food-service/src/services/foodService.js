const mongoose = require("mongoose");
const FoodListing = require("../models/FoodListing");
const Claim = require("../models/Claim");
const OrganizationLookup = require("../models/OrganizationLookup");
const { expireOverdueListings } = require("./expirationService");
const { getVerifiedOrganization, getOrganizationByUserId } = require("./organizationLookupService");
const { toPublicListing, toPublicClaim } = require("../utils/listingSerializer");
const { distanceKm } = require("../utils/geo");
const AppError = require("../utils/AppError");
const {
  FOOD_STATUSES,
  CLAIM_STATUSES,
  USER_ROLES,
} = require("../../../shared/constants");

function asObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid identifier", 400);
  }
  return new mongoose.Types.ObjectId(id);
}

async function getListingOrThrow(id) {
  const listing = await FoodListing.findById(asObjectId(id));
  if (!listing) {
    throw new AppError("Food listing not found", 404);
  }
  return listing;
}

function assertCanUpdate(listing, actor) {
  if (actor.role === USER_ROLES.ADMIN) {
    return;
  }
  if (actor.role !== USER_ROLES.PROVIDER || listing.providerId.toString() !== actor.userId) {
    throw new AppError("You can only update your own listings", 403);
  }
  if (listing.status !== FOOD_STATUSES.AVAILABLE) {
    throw new AppError("Only available listings can be updated", 409);
  }
}

async function createListing(actor, payload) {
  const providerId =
    actor.role === USER_ROLES.ADMIN && payload.providerId
      ? asObjectId(payload.providerId)
      : asObjectId(actor.userId);

  const listing = await FoodListing.create({
    providerId,
    foodName: payload.foodName,
    category: payload.category,
    quantity: payload.quantity,
    unit: payload.unit,
    description: payload.description || "",
    pickupLocation: payload.pickupLocation,
    availableFrom: payload.availableFrom,
    availableUntil: payload.availableUntil,
    expiryDate: payload.expiryDate,
    status: FOOD_STATUSES.AVAILABLE,
  });

  return toPublicListing(listing);
}

function buildListFilter(actor, filters) {
  const query = {};

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.minQuantity != null || filters.maxQuantity != null) {
    query.quantity = {};
    if (filters.minQuantity != null) {
      query.quantity.$gte = filters.minQuantity;
    }
    if (filters.maxQuantity != null) {
      query.quantity.$lte = filters.maxQuantity;
    }
  }

  if (actor.role === USER_ROLES.PROVIDER && filters.mine) {
    query.providerId = asObjectId(actor.userId);
  }

  if (filters.status) {
    query.status = filters.status;
  } else if (actor.role === USER_ROLES.ADMIN) {
    // Admin sees every status unless a filter is provided.
  } else if (actor.role === USER_ROLES.PROVIDER && filters.mine) {
    // Providers see every status on their own listings.
  } else {
    query.status = FOOD_STATUSES.AVAILABLE;
  }

  if (filters.urgencyHours != null) {
    const until = new Date(Date.now() + filters.urgencyHours * 60 * 60 * 1000);
    query.expiryDate = { ...(query.expiryDate || {}), $lte: until };
  }

  return query;
}

async function listListings(actor, filters) {
  await expireOverdueListings();
  const query = buildListFilter(actor, filters);

  if (
    actor.role === USER_ROLES.ORGANIZATION &&
    (filters.status === FOOD_STATUSES.RESERVED || filters.status === FOOD_STATUSES.COLLECTED)
  ) {
    const organization = await OrganizationLookup.findOne({ userId: actor.userId });
    if (!organization) {
      return [];
    }
    query.reservedBy = organization._id;
  }

  const sort = filters.urgency || filters.urgencyHours != null ? { expiryDate: 1 } : { createdAt: -1 };
  let listings = await FoodListing.find(query).sort(sort);

  if (filters.latitude != null && filters.longitude != null) {
    const maxDistanceKm = filters.maxDistanceKm ?? 25;
    listings = listings
      .map((listing) => {
        const km = distanceKm(
          filters.latitude,
          filters.longitude,
          listing.pickupLocation.latitude,
          listing.pickupLocation.longitude
        );
        return { listing, km };
      })
      .filter((item) => item.km <= maxDistanceKm)
      .sort((a, b) => a.km - b.km)
      .map((item) => item.listing);
  }

  return listings.map(toPublicListing);
}

async function getListing(id) {
  await expireOverdueListings();
  const listing = await getListingOrThrow(id);
  return toPublicListing(listing);
}

async function updateListing(id, actor, payload) {
  const listing = await getListingOrThrow(id);
  assertCanUpdate(listing, actor);

  const allowed = [
    "foodName",
    "category",
    "quantity",
    "unit",
    "description",
    "pickupLocation",
    "availableFrom",
    "availableUntil",
    "expiryDate",
  ];

  for (const field of allowed) {
    if (payload[field] !== undefined) {
      listing[field] = payload[field];
    }
  }

  if (actor.role === USER_ROLES.ADMIN && payload.status) {
    listing.status = payload.status;
    if (payload.status === FOOD_STATUSES.AVAILABLE) {
      listing.reservedBy = null;
      listing.claimedQuantity = 0;
    }
  }

  await listing.save();
  return toPublicListing(listing);
}

async function claimListing(id, actor, quantity) {
  await expireOverdueListings();
  const organization = await getVerifiedOrganization(actor.userId);
  const listing = await getListingOrThrow(id);

  if (listing.status === FOOD_STATUSES.EXPIRED) {
    throw new AppError("Expired listings cannot be claimed", 409);
  }
  if (listing.status === FOOD_STATUSES.RESERVED) {
    throw new AppError("Reserved listings cannot be claimed again", 409);
  }
  if (listing.status === FOOD_STATUSES.COLLECTED) {
    throw new AppError("Collected listings cannot be claimed", 409);
  }
  if (listing.status !== FOOD_STATUSES.AVAILABLE) {
    throw new AppError("Only available listings can be claimed", 409);
  }

  const remaining = listing.quantity - listing.claimedQuantity;
  const claimQuantity = quantity == null ? remaining : quantity;
  if (claimQuantity <= 0 || claimQuantity > remaining) {
    throw new AppError("Claim quantity is invalid for this listing", 400);
  }

  const reserved = await FoodListing.findOneAndUpdate(
    { _id: listing._id, status: FOOD_STATUSES.AVAILABLE },
    {
      $set: {
        status: FOOD_STATUSES.RESERVED,
        reservedBy: organization._id,
        claimedQuantity: listing.claimedQuantity + claimQuantity,
      },
    },
    { new: true, runValidators: true }
  );

  if (!reserved) {
    throw new AppError("Reserved listings cannot be claimed again", 409);
  }

  const claimedAt = new Date();
  let claim;
  try {
    claim = await Claim.create({
      listingId: reserved._id,
      organizationId: organization._id,
      quantity: claimQuantity,
      status: CLAIM_STATUSES.RESERVED,
      claimedAt,
    });
  } catch (error) {
    await FoodListing.findByIdAndUpdate(reserved._id, {
      $set: {
        status: FOOD_STATUSES.AVAILABLE,
        reservedBy: null,
        claimedQuantity: listing.claimedQuantity,
      },
    });
    throw error;
  }

  return {
    listing: toPublicListing(reserved),
    claim: toPublicClaim(claim),
  };
}

async function collectListing(id, actor) {
  const listing = await getListingOrThrow(id);

  if (listing.status === FOOD_STATUSES.EXPIRED) {
    throw new AppError("Expired listings cannot be collected", 409);
  }
  if (listing.status === FOOD_STATUSES.COLLECTED) {
    throw new AppError("Listing is already collected", 409);
  }
  if (listing.status !== FOOD_STATUSES.RESERVED) {
    throw new AppError("Only reserved listings can be collected", 409);
  }

  const isAdmin = actor.role === USER_ROLES.ADMIN;
  const isOwner = actor.role === USER_ROLES.PROVIDER && listing.providerId.toString() === actor.userId;
  let isReservingOrg = false;
  if (actor.role === USER_ROLES.ORGANIZATION) {
    const organization = await getOrganizationByUserId(actor.userId);
    isReservingOrg = listing.reservedBy && listing.reservedBy.toString() === organization._id.toString();
  }

  if (!isAdmin && !isOwner && !isReservingOrg) {
    throw new AppError("Only the reserving organization, listing provider, or an admin can collect", 403);
  }

  const collectedAt = new Date();
  listing.status = FOOD_STATUSES.COLLECTED;
  await listing.save();

  const claim = await Claim.findOneAndUpdate(
    { listingId: listing._id, status: CLAIM_STATUSES.RESERVED },
    { $set: { status: CLAIM_STATUSES.COLLECTED, collectedAt } },
    { new: true, runValidators: true }
  );

  if (!claim) {
    throw new AppError("Active claim not found for this listing", 404);
  }

  return {
    listing: toPublicListing(listing),
    claim: toPublicClaim(claim),
  };
}

module.exports = {
  createListing,
  listListings,
  getListing,
  updateListing,
  claimListing,
  collectListing,
};
