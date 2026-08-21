const express = require("express");
const organizationController = require("../controllers/organizationController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const asyncHandler = require("../utils/asyncHandler");
const { USER_ROLES } = require("../../../shared/constants");
const {
  validateCreate,
  validateUpdate,
  parseListQuery,
} = require("../validators/organizationValidators");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize(USER_ROLES.PROVIDER, USER_ROLES.ORGANIZATION, USER_ROLES.ADMIN),
  parseListQuery,
  asyncHandler(organizationController.list)
);

router.post(
  "/",
  authenticate,
  authorize(USER_ROLES.ORGANIZATION),
  validateCreate,
  asyncHandler(organizationController.create)
);

router.get(
  "/profile",
  authenticate,
  authorize(USER_ROLES.ORGANIZATION),
  asyncHandler(organizationController.getProfile)
);

router.patch(
  "/profile",
  authenticate,
  authorize(USER_ROLES.ORGANIZATION),
  validateUpdate,
  asyncHandler(organizationController.updateProfile)
);

router.get(
  "/:id",
  authenticate,
  authorize(USER_ROLES.PROVIDER, USER_ROLES.ORGANIZATION, USER_ROLES.ADMIN),
  asyncHandler(organizationController.getById)
);

router.post(
  "/:id/verify",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  asyncHandler(organizationController.verify)
);

module.exports = router;
