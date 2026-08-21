const express = require("express");
const healthController = require("../controllers/healthController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(healthController.getHealth));

module.exports = router;