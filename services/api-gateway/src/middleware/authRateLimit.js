function isLoginOrRegister(req) {
  return req.method === "POST" && (req.path === "/register" || req.path === "/login");
}

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
  max: 60,
  skip: (req) => process.env.NODE_ENV === "test" || !isLoginOrRegister(req),
  getKey: (req) => req.ip || req.socket?.remoteAddress || "unknown",
});

module.exports = { createRateLimiter, loginRegisterLimiter, isLoginOrRegister };
