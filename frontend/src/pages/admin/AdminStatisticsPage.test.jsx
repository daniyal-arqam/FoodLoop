import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { AdminStatisticsPage } from "./AdminStatisticsPage.jsx";

vi.mock("../../services/foodService.js", () => ({
  fetchFoods: vi.fn(),
}));

vi.mock("../../services/organizationService.js", () => ({
  fetchOrganizations: vi.fn(),
}));

vi.mock("../../services/authService.js", () => ({
  fetchAdminUsers: vi.fn(),
}));

import { fetchFoods } from "../../services/foodService.js";
import { fetchOrganizations } from "../../services/organizationService.js";
import { fetchAdminUsers } from "../../services/authService.js";

describe("AdminStatisticsPage", () => {
  it("renders breakdowns from live APIs", async () => {
    fetchFoods.mockResolvedValue([
      { id: "1", category: "Bakery", status: "Available" },
      { id: "2", category: "Dairy", status: "Collected", claimedQuantity: 5, quantity: 5 },
    ]);
    fetchOrganizations.mockResolvedValue([{ id: "o1", verified: true }]);
    fetchAdminUsers.mockResolvedValue([
      { id: "u1", role: "Admin", isActive: true },
      { id: "u2", role: "Provider", isActive: true },
    ]);

    render(
      <MemoryRouter>
        <AdminStatisticsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Listings by status")).toBeInTheDocument();
    expect(screen.getByText("Listings by category")).toBeInTheDocument();
    expect(screen.getByText("Users by role")).toBeInTheDocument();
    expect(screen.getByText("Bakery")).toBeInTheDocument();
  });
});
