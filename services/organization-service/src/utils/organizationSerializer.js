function toPublicOrganization(organization) {
  const doc = organization.toObject ? organization.toObject() : organization;
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    organizationName: doc.organizationName,
    description: doc.description,
    address: doc.address,
    location: {
      latitude: doc.location.latitude,
      longitude: doc.location.longitude,
    },
    foodCategoriesNeeded: doc.foodCategoriesNeeded,
    requiredQuantity: doc.requiredQuantity,
    verified: doc.verified,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

module.exports = { toPublicOrganization };
