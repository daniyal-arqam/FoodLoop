import { USER_ROLES } from "./constants.js";

export function dashboardPathForRole(role) {
  if (role === USER_ROLES.PROVIDER) return "/provider/dashboard";
  if (role === USER_ROLES.ORGANIZATION) return "/organization/dashboard";
  if (role === USER_ROLES.ADMIN) return "/admin/dashboard";
  return "/";
}

export function canAccessPath(role, pathname) {
  if (!role || !pathname) return false;
  if (pathname.startsWith("/provider")) return role === USER_ROLES.PROVIDER;
  if (pathname.startsWith("/organization")) return role === USER_ROLES.ORGANIZATION;
  if (pathname.startsWith("/admin")) return role === USER_ROLES.ADMIN;
  if (pathname.startsWith("/ai")) return Boolean(role);
  return false;
}

export function postAuthPath(user, requestedPath) {
  if (requestedPath && canAccessPath(user?.role, requestedPath)) {
    return requestedPath;
  }
  return dashboardPathForRole(user?.role);
}

export function hasRole(user, roles) {
  if (!user?.role) return false;
  if (!roles || roles.length === 0) return true;
  return roles.includes(user.role);
}
