const express = require("express");
const foodController = require("../controllers/foodController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const asyncHandler = require("../utils/asyncHandler");
const { USER_ROLES } = require("../../../shared/constants");
const {
  validateCreate,
  validateUpdate,
  validateClaim,
  parseListQuery,
} = require("../validators/foodValidators");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize(USER_ROLES.PROVIDER, USER_ROLES.ADMIN),
  validateCreate,
  asyncHandler(foodController.create)
);

router.get(
  "/",
  authenticate,
  authorize(USER_ROLES.PROVIDER, USER_ROLES.ORGANIZATION, USER_ROLES.ADMIN),
  parseListQuery,
  asyncHandler(foodController.list)
);

router.get(
  "/:id",
  authenticate,
  authorize(USER_ROLES.PROVIDER, USER_ROLES.ORGANIZATION, USER_ROLES.ADMIN),
  asyncHandler(foodController.getById)
);

router.patch(
  "/:id",
  authenticate,
  authorize(USER_ROLES.PROVIDER, USER_ROLES.ADMIN),
  validateUpdate,
  asyncHandler(foodController.update)
);

router.post(
  "/:id/claim",
  authenticate,
  authorize(USER_ROLES.ORGANIZATION),
  validateClaim,
  asyncHandler(foodController.claim)
);

router.post(
  "/:id/collect",
  authenticate,
  authorize(USER_ROLES.ORGANIZATION, USER_ROLES.PROVIDER, USER_ROLES.ADMIN),
  asyncHandler(foodController.collect)
);

module.exports = router;
