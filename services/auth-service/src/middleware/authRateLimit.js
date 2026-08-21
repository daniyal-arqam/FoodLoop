function createRateLimiter({ windowMs, max, getKey, skip }) {
  const hits = new Map();

  return function rateLimiter(req, res, next) {
    if (skip && skip(req)) {
      return next();
    }

    const key = getKey(req);
    const now = Date.now();
    let bucket = hits.get(key);

    if (!bucket || now - bucket.start > windowMs) {
      bucket = { start: now, count: 0 };
    }

    bucket.count += 1;
    hits.set(key, bucket);

    if (bucket.count > max) {
      return res.status(429).json({
        success: false,
        message: "Too many authentication attempts. Try again later.",
        data: null,
      });
    }

    return next();
  };
}

const loginRegisterLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => process.env.NODE_ENV === "test",
  getKey: (req) => String(req.body?.email || req.ip || "unknown").toLowerCase(),
});

module.exports = { createRateLimiter, loginRegisterLimiter };
