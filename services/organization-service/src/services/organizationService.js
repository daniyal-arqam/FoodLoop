const mongoose = require("mongoose");
const Organization = require("../models/Organization");
const { toPublicOrganization } = require("../utils/organizationSerializer");
const AppError = require("../utils/AppError");
const { USER_ROLES } = require("../../../shared/constants");
const { escapeRegex } = require("../../../shared/escapeRegex");

function asObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid identifier", 400);
  }
  return new mongoose.Types.ObjectId(id);
}

async function getByIdOrThrow(id) {
  const organization = await Organization.findById(asObjectId(id));
  if (!organization) {
    throw new AppError("Organization not found", 404);
  }
  return organization;
}

async function createProfile(actor, payload) {
  const existing = await Organization.findOne({ userId: actor.userId });
  if (existing) {
    throw new AppError("Organization profile already exists", 409);
  }

  const organization = await Organization.create({
    userId: asObjectId(actor.userId),
    organizationName: payload.organizationName,
    description: payload.description || "",
    address: payload.address,
    location: payload.location,
    foodCategoriesNeeded: payload.foodCategoriesNeeded,
    requiredQuantity: payload.requiredQuantity,
    verified: false,
  });

  return toPublicOrganization(organization);
}

function buildSearchFilter(actor, filters) {
  const query = {};

  if (filters.q) {
    const term = String(filters.q).slice(0, 100);
    query.organizationName = { $regex: escapeRegex(term), $options: "i" };
  }

  if (filters.category) {
    query.foodCategoriesNeeded = filters.category;
  }

  if (actor.role === USER_ROLES.ADMIN) {
    if (filters.verified === true || filters.verified === false) {
      query.verified = filters.verified;
    }
  } else {
    query.verified = true;
  }

  return query;
}

async function searchOrganizations(actor, filters) {
  const query = buildSearchFilter(actor, filters);
  const organizations = await Organization.find(query).sort({ organizationName: 1 });
  return organizations.map(toPublicOrganization);
}

async function getOrganization(id, actor) {
  const organization = await getByIdOrThrow(id);
  const isOwner = organization.userId.toString() === actor.userId;
  const isAdmin = actor.role === USER_ROLES.ADMIN;

  if (!organization.verified && !isOwner && !isAdmin) {
    throw new AppError("Organization is not verified", 403);
  }

  return toPublicOrganization(organization);
}

async function getOwnProfile(actor) {
  const organization = await Organization.findOne({ userId: actor.userId });
  if (!organization) {
    throw new AppError("Organization profile not found", 404);
  }
  return toPublicOrganization(organization);
}

async function updateOwnProfile(actor, payload) {
  const organization = await Organization.findOne({ userId: actor.userId });
  if (!organization) {
    throw new AppError("Organization profile not found", 404);
  }

  const allowed = [
    "organizationName",
    "description",
    "address",
    "location",
    "foodCategoriesNeeded",
    "requiredQuantity",
  ];

  for (const field of allowed) {
    if (payload[field] !== undefined) {
      organization[field] = payload[field];
    }
  }

  await organization.save();
  return toPublicOrganization(organization);
}

async function verifyOrganization(id, verified = true) {
  const organization = await getByIdOrThrow(id);
  organization.verified = Boolean(verified);
  await organization.save();
  return toPublicOrganization(organization);
}

module.exports = {
  createProfile,
  searchOrganizations,
  getOrganization,
  getOwnProfile,
  updateOwnProfile,
  verifyOrganization,
};
