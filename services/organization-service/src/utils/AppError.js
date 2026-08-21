class AppError extends Error {
  constructor(message, statusCode = 400, data = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

module.exports = AppError;
