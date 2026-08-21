const FoodListing = require("../models/FoodListing");
const { FOOD_STATUSES } = require("../../../shared/constants");

function isOverdue(listing, now = new Date()) {
  if (listing.status !== FOOD_STATUSES.AVAILABLE) {
    return false;
  }
  return listing.expiryDate <= now || listing.availableUntil <= now;
}

function overdueFilter(now = new Date()) {
  return {
    status: FOOD_STATUSES.AVAILABLE,
    $or: [{ expiryDate: { $lte: now } }, { availableUntil: { $lte: now } }],
  };
}

async function findOverdueListings(now = new Date()) {
  return FoodListing.find(overdueFilter(now));
}

async function expireOverdueListings(now = new Date()) {
  const result = await FoodListing.updateMany(overdueFilter(now), {
    $set: { status: FOOD_STATUSES.EXPIRED },
  });
  return result.modifiedCount;
}

module.exports = {
  isOverdue,
  overdueFilter,
  findOverdueListings,
  expireOverdueListings,
};
