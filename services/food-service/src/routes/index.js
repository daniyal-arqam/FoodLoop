const express = require("express");
const healthRouter = require("./health");
const foodsRouter = require("./foods");

const router = express.Router();

router.use("/health", healthRouter);
router.use("/foods", foodsRouter);

module.exports = router;
