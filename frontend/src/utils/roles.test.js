import { describe, expect, it } from "vitest";
import { USER_ROLES } from "./constants.js";
import { canAccessPath, dashboardPathForRole, hasRole, postAuthPath } from "./roles.js";

describe("role dashboards", () => {
  it("sends each role to its own dashboard after login", () => {
    expect(dashboardPathForRole(USER_ROLES.PROVIDER)).toBe("/provider/dashboard");
    expect(dashboardPathForRole(USER_ROLES.ORGANIZATION)).toBe("/organization/dashboard");
    expect(dashboardPathForRole(USER_ROLES.ADMIN)).toBe("/admin/dashboard");
  });

  it("blocks cross-role routes for every role", () => {
    expect(canAccessPath(USER_ROLES.PROVIDER, "/admin/dashboard")).toBe(false);
    expect(canAccessPath(USER_ROLES.ORGANIZATION, "/provider/dashboard")).toBe(false);
    expect(canAccessPath(USER_ROLES.ADMIN, "/organization/food")).toBe(false);
    expect(canAccessPath(USER_ROLES.PROVIDER, "/provider/listings")).toBe(true);
    expect(canAccessPath(USER_ROLES.ORGANIZATION, "/organization/claims")).toBe(true);
    expect(canAccessPath(USER_ROLES.ADMIN, "/admin/organizations")).toBe(true);
  });

  it("honors a safe return path and ignores a forbidden one", () => {
    const provider = { role: USER_ROLES.PROVIDER };
    const admin = { role: USER_ROLES.ADMIN };
    const organization = { role: USER_ROLES.ORGANIZATION };

    expect(postAuthPath(provider, "/provider/listings/new")).toBe("/provider/listings/new");
    expect(postAuthPath(provider, "/admin/dashboard")).toBe("/provider/dashboard");
    expect(postAuthPath(organization, "/organization/food")).toBe("/organization/food");
    expect(postAuthPath(admin, "/login")).toBe("/admin/dashboard");
  });

  it("checks roles without duplicating dashboard maps", () => {
    expect(hasRole({ role: USER_ROLES.ADMIN }, [USER_ROLES.ADMIN])).toBe(true);
    expect(hasRole({ role: USER_ROLES.PROVIDER }, [USER_ROLES.ADMIN])).toBe(false);
  });
});
