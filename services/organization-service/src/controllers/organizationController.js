const organizationService = require("../services/organizationService");
const { sendSuccess } = require("../utils/apiResponse");

async function create(req, res) {
  const organization = await organizationService.createProfile(req.user, req.body);
  return sendSuccess(res, { organization }, "Organization profile created", 201);
}

async function list(req, res) {
  const organizations = await organizationService.searchOrganizations(req.user, req.listFilters);
  return sendSuccess(res, { organizations }, "Organizations retrieved");
}

async function getById(req, res) {
  const organization = await organizationService.getOrganization(req.params.id, req.user);
  return sendSuccess(res, { organization }, "Organization retrieved");
}

async function getProfile(req, res) {
  const organization = await organizationService.getOwnProfile(req.user);
  return sendSuccess(res, { organization }, "Organization profile retrieved");
}

async function updateProfile(req, res) {
  const organization = await organizationService.updateOwnProfile(req.user, req.body);
  return sendSuccess(res, { organization }, "Organization profile updated");
}

async function verify(req, res) {
  const verified = req.body?.verified === undefined ? true : Boolean(req.body.verified);
  const organization = await organizationService.verifyOrganization(req.params.id, verified);
  return sendSuccess(res, { organization }, "Organization verification updated");
}

module.exports = {
  create,
  list,
  getById,
  getProfile,
  updateProfile,
  verify,
};
