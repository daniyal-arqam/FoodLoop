const OrganizationLookup = require("../models/OrganizationLookup");
const AppError = require("../utils/AppError");

async function getOrganizationByUserId(userId) {
  const organization = await OrganizationLookup.findOne({ userId });
  if (!organization) {
    throw new AppError("Organization profile not found", 403);
  }
  return organization;
}

async function getVerifiedOrganization(userId) {
  const organization = await getOrganizationByUserId(userId);
  if (!organization.verified) {
    throw new AppError("Organization must be verified before claiming", 403);
  }
  return organization;
}

module.exports = { getOrganizationByUserId, getVerifiedOrganization };
