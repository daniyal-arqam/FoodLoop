const express = require("express");
const healthRouter = require("./health");
const organizationsRouter = require("./organizations");

const router = express.Router();

router.use("/health", healthRouter);
router.use("/organizations", organizationsRouter);

module.exports = router;
