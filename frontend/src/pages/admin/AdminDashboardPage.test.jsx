import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { AdminDashboardPage } from "./AdminDashboardPage.jsx";

vi.mock("../../services/foodService.js", () => ({
  fetchFoods: vi.fn(),
}));

vi.mock("../../services/organizationService.js", () => ({
  fetchOrganizations: vi.fn(),
}));

import { fetchFoods } from "../../services/foodService.js";
import { fetchOrganizations } from "../../services/organizationService.js";

describe("AdminDashboardPage", () => {
  it("renders live metrics from listings and organizations", async () => {
    fetchFoods.mockResolvedValue([
      { id: "1", foodName: "Bread", category: "Bakery", status: "Available", quantity: 10 },
      { id: "2", foodName: "Milk", category: "Dairy", status: "Reserved", quantity: 4, claimedQuantity: 4 },
      { id: "3", foodName: "Rice", category: "Other", status: "Collected", quantity: 9, claimedQuantity: 8 },
      { id: "4", foodName: "Salad", category: "Produce", status: "Expired", quantity: 2 },
    ]);
    fetchOrganizations.mockResolvedValue([
      { id: "o1", organizationName: "Kitchen", verified: true },
      { id: "o2", organizationName: "Shelter", verified: false },
    ]);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Total Listings")).toBeInTheDocument();
    expect(screen.getByText("Active Listings")).toBeInTheDocument();
    expect(screen.getByText("Food Rescued")).toBeInTheDocument();
    expect(screen.getByText("Verified Organizations")).toBeInTheDocument();
    expect(screen.getByText("Expired Listings")).toBeInTheDocument();
    expect(screen.getByText("Claims")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows an API error state", async () => {
    fetchFoods.mockRejectedValue(new Error("Gateway unreachable"));
    fetchOrganizations.mockResolvedValue([]);
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Gateway unreachable");
  });
});
