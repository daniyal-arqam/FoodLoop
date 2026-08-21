import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "../../context/ToastContext.jsx";
import { AdminUsersPage } from "./AdminUsersPage.jsx";

vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({ user: { id: "admin-1", role: "Admin" } }),
}));

vi.mock("../../services/authService.js", () => ({
  fetchAdminUsers: vi.fn(),
  setAdminUserActive: vi.fn(),
}));

import { fetchAdminUsers, setAdminUserActive } from "../../services/authService.js";

describe("AdminUsersPage", () => {
  it("lists users from the admin API and deactivates after confirmation", async () => {
    fetchAdminUsers.mockResolvedValue([
      { id: "admin-1", name: "Loop Admin", email: "admin@foodloop.org", role: "Admin", isActive: true },
      { id: "u2", name: "Ayesha Khan", email: "ayesha@example.com", role: "Provider", isActive: true },
    ]);
    setAdminUserActive.mockResolvedValue({ id: "u2", isActive: false });

    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminUsersPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Ayesha Khan")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Deactivate Ayesha Khan");
    await userEvent.click(within(dialog).getByRole("button", { name: "Deactivate" }));

    expect(setAdminUserActive).toHaveBeenCalledWith("u2", false);
  });
});
