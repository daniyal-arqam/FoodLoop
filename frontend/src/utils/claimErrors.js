export function claimErrorKind(error) {
  const message = error?.message || "";
  if (error?.status === 403 && /verified/i.test(message)) return "unverified";
  if (/expired/i.test(message)) return "expired";
  if (/reserved|claimed again/i.test(message)) return "reserved";
  return "generic";
}

export function claimErrorMessage(error) {
  const kind = claimErrorKind(error);
  if (kind === "unverified") return "Only verified organizations can claim food.";
  if (kind === "expired") return "This listing has expired and cannot be claimed.";
  if (kind === "reserved") return "This listing is already reserved.";
  return error?.message || "Unable to claim this listing.";
}
