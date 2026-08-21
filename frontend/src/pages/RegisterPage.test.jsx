import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { RegisterPage } from "./RegisterPage.jsx";
import { USER_ROLES } from "../utils/constants.js";
import { ToastProvider } from "../context/ToastContext.jsx";

vi.mock("../hooks/useAuth.js", () => ({
  useAuth: () => ({
    register: vi.fn(),
  }),
}));

describe("RegisterPage", () => {
  it("collects name, email, password, and public roles only", () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <RegisterPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Role")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Provider" }).value).toBe(USER_ROLES.PROVIDER);
    expect(screen.getByRole("option", { name: "Organization" }).value).toBe(USER_ROLES.ORGANIZATION);
    expect(screen.queryByRole("option", { name: "Admin" })).not.toBeInTheDocument();
  });
});
