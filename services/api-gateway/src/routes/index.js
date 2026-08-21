const express = require("express");
const healthRouter = require("./health");
const {
  authProxy,
  foodProxy,
  organizationProxy,
  matcherProxy,
  aiProxy,
} = require("./proxy");

const router = express.Router();

router.use("/health", healthRouter);
router.use("/api/auth", ...authProxy());
router.use("/api/foods", ...foodProxy());
router.use("/api/organizations", ...organizationProxy());
router.use("/api/matching", ...matcherProxy());
router.use("/api/ai", ...aiProxy());

module.exports = router;
