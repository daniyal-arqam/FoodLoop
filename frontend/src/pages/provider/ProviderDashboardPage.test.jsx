import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { ProviderDashboardPage } from "./ProviderDashboardPage.jsx";

vi.mock("../../services/foodService.js", () => ({
  fetchMyListings: vi.fn(),
}));

vi.mock("../../services/matchingService.js", () => ({
  estimateImpact: vi.fn(),
}));

import { fetchMyListings } from "../../services/foodService.js";
import { estimateImpact } from "../../services/matchingService.js";

describe("ProviderDashboardPage", () => {
  it("renders counts from backend listings, not placeholders", async () => {
    fetchMyListings.mockResolvedValue([
      { id: "1", foodName: "Bread", category: "Bakery", quantity: 10, unit: "kg", status: "Available", expiryDate: "2026-08-22T00:00:00.000Z", createdAt: "2026-08-21T00:00:00.000Z" },
      { id: "2", foodName: "Milk", category: "Dairy", quantity: 4, unit: "L", status: "Reserved", expiryDate: "2026-08-22T00:00:00.000Z", createdAt: "2026-08-20T00:00:00.000Z" },
      { id: "3", foodName: "Rice", category: "Other", quantity: 9, unit: "kg", claimedQuantity: 9, status: "Collected", expiryDate: "2026-08-19T00:00:00.000Z", createdAt: "2026-08-19T00:00:00.000Z" },
      { id: "4", foodName: "Salad", category: "Produce", quantity: 2, unit: "kg", status: "Expired", expiryDate: "2026-08-18T00:00:00.000Z", createdAt: "2026-08-18T00:00:00.000Z" },
    ]);
    estimateImpact.mockResolvedValue({
      data: { estimatedWasteKg: 2.7, co2AvoidedKg: 6.75, rescuedPortions: 9 },
    });

    render(
      <MemoryRouter>
        <ProviderDashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Active Listings")).toBeInTheDocument();
    expect(screen.getByText("Claimed Food")).toBeInTheDocument();
    expect(screen.getByText("Collected Food")).toBeInTheDocument();
    expect(screen.getByText("Expired Food")).toBeInTheDocument();
    expect(screen.getByText("Total Portions Rescued")).toBeInTheDocument();
    expect(screen.getByText("Estimated Waste Reduction")).toBeInTheDocument();
    expect(screen.getByText("2.7 kg")).toBeInTheDocument();
    expect(screen.getByText("Bread")).toBeInTheDocument();
    expect(screen.getAllByText("9").length).toBeGreaterThan(0);
  });

  it("shows an empty state when the API returns no listings", async () => {
    fetchMyListings.mockResolvedValue([]);
    estimateImpact.mockResolvedValue({ data: { estimatedWasteKg: 0 } });
    render(
      <MemoryRouter>
        <ProviderDashboardPage />
      </MemoryRouter>
    );
    expect(await screen.findByText("No listings yet")).toBeInTheDocument();
  });

  it("shows an API error state", async () => {
    fetchMyListings.mockRejectedValue(new Error("Gateway unreachable"));
    render(
      <MemoryRouter>
        <ProviderDashboardPage />
      </MemoryRouter>
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Gateway unreachable");
  });
});
