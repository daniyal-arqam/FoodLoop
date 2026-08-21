export function listingToMatchInput(listing) {
  return {
    id: listing.id,
    foodName: listing.foodName,
    category: listing.category,
    quantity: listing.quantity,
    latitude: listing.pickupLocation?.latitude,
    longitude: listing.pickupLocation?.longitude,
    expiryDate: listing.expiryDate,
    status: listing.status,
  };
}

export function organizationToMatchInput(organization) {
  return {
    id: organization.id,
    organizationName: organization.organizationName,
    verified: organization.verified,
    latitude: organization.location?.latitude,
    longitude: organization.location?.longitude,
    foodCategoriesNeeded: organization.foodCategoriesNeeded,
    requiredQuantity: organization.requiredQuantity,
  };
}
