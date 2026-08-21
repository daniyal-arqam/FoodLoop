const authService = require("../services/authService");
const { sendSuccess } = require("../utils/apiResponse");

async function register(req, res) {
  const result = await authService.register(req.body);
  return sendSuccess(res, result, "Registration successful", 201);
}

async function login(req, res) {
  const result = await authService.login(req.body);
  return sendSuccess(res, result, "Login successful");
}

async function me(req, res) {
  const user = authService.getCurrentUser(req.user.user);
  return sendSuccess(res, { user }, "Authenticated user");
}

async function logout(_req, res) {
  return sendSuccess(
    res,
    null,
    "Logged out. Discard the access token on the client."
  );
}

async function listUsers(_req, res) {
  const users = await authService.listUsers();
  return sendSuccess(res, { users }, "Users retrieved");
}

async function setUserActive(req, res) {
  const user = await authService.setUserActive(
    req.user.userId,
    req.params.id,
    req.body?.isActive
  );
  return sendSuccess(res, { user }, "User updated");
}

module.exports = {
  register,
  login,
  me,
  logout,
  listUsers,
  setUserActive,
};
