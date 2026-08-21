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
  if (error.data?.errors?.length) {
    return error.data.errors.join(". ");
  }
  return error.message || "Something went wrong";
}
