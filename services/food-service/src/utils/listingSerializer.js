function toPublicListing(listing) {
  const doc = listing.toObject ? listing.toObject() : listing;
  return {
    id: doc._id.toString(),
    providerId: doc.providerId.toString(),
    foodName: doc.foodName,
    category: doc.category,
    quantity: doc.quantity,
    unit: doc.unit,
    description: doc.description,
    pickupLocation: {
      address: doc.pickupLocation.address,
      latitude: doc.pickupLocation.latitude,
      longitude: doc.pickupLocation.longitude,
    },
    availableFrom: doc.availableFrom,
    availableUntil: doc.availableUntil,
    expiryDate: doc.expiryDate,
    status: doc.status,
    reservedBy: doc.reservedBy ? doc.reservedBy.toString() : null,
    claimedQuantity: doc.claimedQuantity,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toPublicClaim(claim) {
  const doc = claim.toObject ? claim.toObject() : claim;
  return {
    id: doc._id.toString(),
    listingId: doc.listingId.toString(),
    organizationId: doc.organizationId.toString(),
    quantity: doc.quantity,
    status: doc.status,
    claimedAt: doc.claimedAt,
    collectedAt: doc.collectedAt,
  };
}

module.exports = { toPublicListing, toPublicClaim };
