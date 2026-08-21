import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import { USER_ROLES } from "../utils/constants.js";
import { clearAccessToken, resetTokenStore } from "../services/tokenStore.js";

vi.mock("../services/authService.js", () => ({
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
  fetchCurrentUser: vi.fn(),
  logoutAccount: vi.fn(),
}));

import {
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "../services/authService.js";

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="role">{auth.currentUser?.role || "none"}</span>
      <span data-testid="name">{auth.currentUser?.name || "anonymous"}</span>
      <span data-testid="authed">{String(auth.isAuthenticated)}</span>
      <button type="button" onClick={() => auth.login({ email: "a@b.c", password: "Password1" })}>
        login
      </button>
      <button
        type="button"
        onClick={() =>
          auth.register({
            name: "New Org",
            email: "org@example.com",
            password: "Password1",
            role: USER_ROLES.ORGANIZATION,
          })
        }
      >
        register-org
      </button>
      <button
        type="button"
        onClick={() =>
          auth
            .register({
              name: "Bad Admin",
              email: "admin@example.com",
              password: "Password1",
              role: USER_ROLES.ADMIN,
            })
            .catch((error) => {
              document.getElementById("err").textContent = error.message;
            })
        }
      >
        register-admin
      </button>
      <button type="button" onClick={() => auth.logout()}>
        logout
      </button>
      <p id="err" data-testid="err" />
    </div>
  );
}

function session(role, name = `${role} User`) {
  return {
    data: {
      user: { id: `${role}-1`, name, email: `${role.toLowerCase()}@foodloop.org`, role },
      accessToken: `${role}-token`,
    },
  };
}

describe("AuthProvider", () => {
  beforeEach(() => {
    resetTokenStore();
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
    fetchCurrentUser.mockRejectedValue({ status: 401, message: "Authentication required" });
  });

  afterEach(() => {
    clearAccessToken();
    resetTokenStore();
  });

  it("logs a Provider in and exposes the current user", async () => {
    loginAccount.mockResolvedValue(session(USER_ROLES.PROVIDER, "Ayesha"));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByTestId("role").textContent).toBe(USER_ROLES.PROVIDER));
    expect(screen.getByTestId("name").textContent).toBe("Ayesha");
    expect(screen.getByTestId("authed").textContent).toBe("true");
    expect(loginAccount).toHaveBeenCalledWith({ email: "a@b.c", password: "Password1" });
  });

  it("logs an Organization in", async () => {
    loginAccount.mockResolvedValue(session(USER_ROLES.ORGANIZATION, "Karachi Kitchen"));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByTestId("role").textContent).toBe(USER_ROLES.ORGANIZATION));
  });

  it("logs an Admin in without registration", async () => {
    loginAccount.mockResolvedValue(session(USER_ROLES.ADMIN, "Loop Admin"));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByTestId("role").textContent).toBe(USER_ROLES.ADMIN));
  });

  it("registers an Organization and refuses Admin registration before calling the API", async () => {
    registerAccount.mockResolvedValue(session(USER_ROLES.ORGANIZATION, "New Org"));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText("register-admin"));
    await waitFor(() =>
      expect(screen.getByTestId("err").textContent).toMatch(/Admin registration is not publicly available/)
    );
    expect(registerAccount).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("register-org"));
    await waitFor(() => expect(screen.getByTestId("role").textContent).toBe(USER_ROLES.ORGANIZATION));
    expect(registerAccount).toHaveBeenCalledTimes(1);
  });

  it("logs out and discards the current user", async () => {
    loginAccount.mockResolvedValue(session(USER_ROLES.PROVIDER, "Ayesha"));
    logoutAccount.mockResolvedValue({ success: true });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await userEvent.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByTestId("authed").textContent).toBe("true"));
    await userEvent.click(screen.getByText("logout"));
    await waitFor(() => expect(screen.getByTestId("authed").textContent).toBe("false"));
    expect(screen.getByTestId("role").textContent).toBe("none");
  });
});
