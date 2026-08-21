const foodService = require("../services/foodService");
const { sendSuccess } = require("../utils/apiResponse");

async function create(req, res) {
  const listing = await foodService.createListing(req.user, req.body);
  return sendSuccess(res, { listing }, "Listing created", 201);
}

async function list(req, res) {
  const listings = await foodService.listListings(req.user, req.listFilters);
  return sendSuccess(res, { listings }, "Listings retrieved");
}

async function getById(req, res) {
  const listing = await foodService.getListing(req.params.id);
  return sendSuccess(res, { listing }, "Listing retrieved");
}

async function update(req, res) {
  const listing = await foodService.updateListing(req.params.id, req.user, req.body);
  return sendSuccess(res, { listing }, "Listing updated");
}

async function claim(req, res) {
  const result = await foodService.claimListing(req.params.id, req.user, req.body?.quantity);
  return sendSuccess(res, result, "Listing claimed");
}

async function collect(req, res) {
  const result = await foodService.collectListing(req.params.id, req.user);
  return sendSuccess(res, result, "Listing collected");
}

module.exports = {
  create,
  list,
  getById,
  update,
  claim,
  collect,
};
