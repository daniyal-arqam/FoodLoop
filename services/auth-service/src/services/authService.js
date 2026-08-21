const crypto = require("crypto");
const User = require("../models/User");
const { PUBLIC_REGISTRATION_ROLES, USER_ROLES } = require("../../../shared/constants");
const { hashPassword, comparePassword } = require("./passwordService");
const { signAccessToken } = require("./tokenService");
const { verifyGoogleIdToken } = require("./googleAuth");
const { toPublicUser } = require("../utils/userSerializer");
const AppError = require("../utils/AppError");

async function register({ name, email, password, role, phone }) {
  if (role === USER_ROLES.ADMIN || !PUBLIC_REGISTRATION_ROLES.includes(role)) {
    throw new AppError("Admin registration is not publicly available", 403);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role,
    phone: phone || null,
  });

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user),
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordHash"
  );

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is disabled", 403);
  }

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user),
  };
}

async function loginWithGoogle({ idToken, role }) {
  const profile = await verifyGoogleIdToken(idToken);
  let user = await User.findOne({ email: profile.email });

  if (!user) {
    const nextRole = PUBLIC_REGISTRATION_ROLES.includes(role) ? role : USER_ROLES.PROVIDER;
    const name = (profile.name || profile.email.split("@")[0]).slice(0, 100);
    user = await User.create({
      name: name.length >= 2 ? name : "Google user",
      email: profile.email,
      passwordHash: await hashPassword(crypto.randomBytes(32).toString("hex")),
      role: nextRole,
      isVerified: true,
    });
  }

  if (!user.isActive) {
    throw new AppError("Account is disabled", 403);
  }

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user),
  };
}

function getCurrentUser(user) {
  return toPublicUser(user);
}

async function listUsers() {
  const users = await User.find().sort({ createdAt: -1 });
  return users.map(toPublicUser);
}

async function setUserActive(actorUserId, targetId, isActive) {
  if (typeof isActive !== "boolean") {
    throw new AppError("isActive must be true or false", 400);
  }
  if (String(actorUserId) === String(targetId) && isActive === false) {
    throw new AppError("You cannot deactivate your own account", 400);
  }
  const user = await User.findById(targetId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  user.isActive = isActive;
  await user.save();
  return toPublicUser(user);
}

module.exports = {
  register,
  login,
  loginWithGoogle,
  getCurrentUser,
  listUsers,
  setUserActive,
};
