const { OAuth2Client } = require("google-auth-library");
const AppError = require("../utils/AppError");

let verifier = null;

function getClientId() {
  return (process.env.GOOGLE_CLIENT_ID || "").trim();
}

async function defaultVerifyGoogleIdToken(idToken) {
  const clientId = getClientId();
  if (!clientId) {
    throw new AppError("Google isn’t connected yet. Try email sign-in.", 503);
  }
  if (!idToken || typeof idToken !== "string") {
    throw new AppError("Google sign-in token is required", 400);
  }

  const client = new OAuth2Client(clientId);
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified === false) {
      throw new AppError("Google account email is not verified", 400);
    }

    return {
      email: String(payload.email).toLowerCase().trim(),
      name: (payload.name || payload.email.split("@")[0]).trim(),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Google could not verify that account.", 401);
  }
}

async function verifyGoogleIdToken(idToken) {
  return (verifier || defaultVerifyGoogleIdToken)(idToken);
}

function setGoogleTokenVerifier(nextVerifier) {
  verifier = nextVerifier;
}

module.exports = {
  verifyGoogleIdToken,
  setGoogleTokenVerifier,
  getClientId,
};
