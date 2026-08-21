function sendSuccess(res, data, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function sendError(res, message, statusCode = 400, data = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
}

module.exports = { sendSuccess, sendError };