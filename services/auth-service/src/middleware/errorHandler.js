function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let data = err.data || null;

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    data = {
      errors: Object.values(err.errors).map((item) => item.message),
    };
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Email is already registered";
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
