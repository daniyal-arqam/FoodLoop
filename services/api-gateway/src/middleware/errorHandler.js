function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let data = err.data || null;

  if (err.name === "AbortError" || err.code === "ABORT_ERR") {
    statusCode = 504;
    message = "Upstream service timed out";
    data = null;
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
    data = null;
  }

  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "Internal server error";
    data = null;
  }

  if (res.headersSent) {
    return;
  }

  res.status(statusCode).json({
    success: false,
    message,
    data,
  });
}

module.exports = errorHandler;
