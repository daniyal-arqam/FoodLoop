import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "../../context/ToastContext.jsx";
import { AdminOrganizationsPage } from "./AdminOrganizationsPage.jsx";

vi.mock("../../services/organizationService.js", () => ({
  fetchOrganizations: vi.fn(),
  verifyOrganization: vi.fn(),
}));

import { fetchOrganizations, verifyOrganization } from "../../services/organizationService.js";

describe("AdminOrganizationsPage", () => {
  it("lists pending organizations and verifies after confirmation", async () => {
    fetchOrganizations.mockResolvedValue([
      { id: "o1", organizationName: "Hope Kitchen", address: "Karachi", verified: false },
      { id: "o2", organizationName: "City Shelter", address: "Lahore", verified: true },
    ]);
    verifyOrganization.mockResolvedValue({ data: { organization: { id: "o1", verified: true } } });

    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminOrganizationsPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Hope Kitchen")).toBeInTheDocument();
    expect(screen.queryByText("City Shelter")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Verify" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Verify Hope Kitchen");
    await userEvent.click(within(dialog).getByRole("button", { name: "Verify" }));

    expect(verifyOrganization).toHaveBeenCalledWith("o1", true);
  });
});
