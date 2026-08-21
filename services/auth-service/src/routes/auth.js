const express = require("express");
const authController = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { USER_ROLES } = require("../../../shared/constants");
const { validateRegister, validateLogin, validateGoogleLogin } = require("../validators/authValidators");
const { loginRegisterLimiter } = require("../middleware/authRateLimit");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", loginRegisterLimiter, validateRegister, asyncHandler(authController.register));
router.post("/login", loginRegisterLimiter, validateLogin, asyncHandler(authController.login));
router.post("/google", loginRegisterLimiter, validateGoogleLogin, asyncHandler(authController.loginWithGoogle));
router.get("/google/config", asyncHandler(authController.googleConfig));
router.post("/logout", authenticate, asyncHandler(authController.logout));
router.get("/me", authenticate, asyncHandler(authController.me));
router.get(
  "/admin/me",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  asyncHandler(authController.me)
);
router.get(
  "/admin/users",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  asyncHandler(authController.listUsers)
);
router.patch(
  "/admin/users/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  asyncHandler(authController.setUserActive)
);

module.exports = router;
