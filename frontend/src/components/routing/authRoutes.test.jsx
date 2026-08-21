import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { RoleRoute } from "./RoleRoute.jsx";
import { USER_ROLES } from "../../utils/constants.js";

vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => mockAuth,
}));

let mockAuth = {
  user: null,
  loading: false,
  isAuthenticated: false,
  hasRole: () => false,
};

function renderGuards(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>login-page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/ai" element={<p>ai-page</p>} />
          <Route element={<RoleRoute roles={[USER_ROLES.PROVIDER]} />}>
            <Route path="/provider/dashboard" element={<p>provider-dashboard</p>} />
          </Route>
          <Route element={<RoleRoute roles={[USER_ROLES.ORGANIZATION]} />}>
            <Route path="/organization/dashboard" element={<p>organization-dashboard</p>} />
          </Route>
          <Route element={<RoleRoute roles={[USER_ROLES.ADMIN]} />}>
            <Route path="/admin/dashboard" element={<p>admin-dashboard</p>} />
            <Route path="/admin/users" element={<p>admin-users</p>} />
            <Route path="/admin/statistics" element={<p>admin-statistics</p>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute and RoleRoute", () => {
  it("sends anonymous users to login", () => {
    mockAuth = { user: null, loading: false, isAuthenticated: false, hasRole: () => false };
    renderGuards("/provider/dashboard");
    expect(screen.getByText("login-page")).toBeInTheDocument();
  });

  it("lets a Provider into the provider dashboard only", () => {
    mockAuth = {
      user: { role: USER_ROLES.PROVIDER },
      loading: false,
      isAuthenticated: true,
      hasRole: (roles) => roles.includes(USER_ROLES.PROVIDER),
    };
    renderGuards("/provider/dashboard");
    expect(screen.getByText("provider-dashboard")).toBeInTheDocument();
  });

  it("redirects a Provider away from the admin dashboard", () => {
    mockAuth = {
      user: { role: USER_ROLES.PROVIDER },
      loading: false,
      isAuthenticated: true,
      hasRole: (roles) => roles.includes(USER_ROLES.PROVIDER),
    };
    renderGuards("/admin/dashboard");
    expect(screen.getByText("provider-dashboard")).toBeInTheDocument();
  });

  it("lets an Organization into its dashboard", () => {
    mockAuth = {
      user: { role: USER_ROLES.ORGANIZATION },
      loading: false,
      isAuthenticated: true,
      hasRole: (roles) => roles.includes(USER_ROLES.ORGANIZATION),
    };
    renderGuards("/organization/dashboard");
    expect(screen.getByText("organization-dashboard")).toBeInTheDocument();
  });

  it("lets an Admin into the admin dashboard", () => {
    mockAuth = {
      user: { role: USER_ROLES.ADMIN },
      loading: false,
      isAuthenticated: true,
      hasRole: (roles) => roles.includes(USER_ROLES.ADMIN),
    };
    renderGuards("/admin/dashboard");
    expect(screen.getByText("admin-dashboard")).toBeInTheDocument();
  });

  it("lets an Admin into Users and Statistics", () => {
    mockAuth = {
      user: { role: USER_ROLES.ADMIN },
      loading: false,
      isAuthenticated: true,
      hasRole: (roles) => roles.includes(USER_ROLES.ADMIN),
    };
    renderGuards("/admin/users");
    expect(screen.getByText("admin-users")).toBeInTheDocument();
  });

  it("redirects a Provider away from admin users", () => {
    mockAuth = {
      user: { role: USER_ROLES.PROVIDER },
      loading: false,
      isAuthenticated: true,
      hasRole: (roles) => roles.includes(USER_ROLES.PROVIDER),
    };
    renderGuards("/admin/users");
    expect(screen.getByText("provider-dashboard")).toBeInTheDocument();
  });

  it("allows any authenticated role onto /ai", () => {
    mockAuth = {
      user: { role: USER_ROLES.ORGANIZATION },
      loading: false,
      isAuthenticated: true,
      hasRole: (roles) => roles.includes(USER_ROLES.ORGANIZATION),
    };
    renderGuards("/ai");
    expect(screen.getByText("ai-page")).toBeInTheDocument();
  });
});
