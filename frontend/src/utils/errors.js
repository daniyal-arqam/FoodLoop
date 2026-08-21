export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function errorMessage(error) {
  if (!error) return "Something went wrong";
  if (error.status === 502 || error.status === 504) {
    return "The API is starting up. Wait a few seconds and try again.";
  }
  if (error.status === 503) {
    const msg = error.message || "";
    if (!msg || /unavailable|gateway|timeout|starting/i.test(msg)) {
      return "The API is starting up. Wait a few seconds and try again.";
    }
  }
  if (error.data?.errors?.length) {
    return error.data.errors.join(". ");
  }
  return error.message || "Something went wrong";
}
