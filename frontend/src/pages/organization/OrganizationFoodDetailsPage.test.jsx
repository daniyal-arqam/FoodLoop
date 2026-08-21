import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrganizationFoodDetailsPage } from "./OrganizationFoodDetailsPage.jsx";
import { ToastProvider } from "../../context/ToastContext.jsx";

vi.mock("../../services/foodService.js", () => ({
  fetchListing: vi.fn(),
  claimListing: vi.fn(),
}));

vi.mock("../../services/organizationService.js", () => ({
  fetchMyOrganization: vi.fn(),
}));

vi.mock("../../services/matchingService.js", () => ({
  decorateWithMatchScores: vi.fn(),
}));

import { fetchListing, claimListing } from "../../services/foodService.js";
import { fetchMyOrganization } from "../../services/organizationService.js";
import { decorateWithMatchScores } from "../../services/matchingService.js";

describe("OrganizationFoodDetailsPage", () => {
  it("renders food details fields from the API", async () => {
    fetchListing.mockResolvedValue({
      id: "food-1",
      foodName: "Fresh bread",
      category: "Bakery",
      quantity: 12,
      unit: "kg",
      status: "Available",
      description: "Surplus loaves",
      providerId: "abc123",
      pickupLocation: { address: "12 Clifton Road", latitude: 24.86, longitude: 67 },
      expiryDate: "2026-08-22T09:00:00.000Z",
    });
    fetchMyOrganization.mockResolvedValue({
      id: "org-1",
      verified: true,
      location: { latitude: 24.86, longitude: 67 },
    });
    decorateWithMatchScores.mockResolvedValue([
      {
        id: "food-1",
        foodName: "Fresh bread",
        category: "Bakery",
        quantity: 12,
        unit: "kg",
        status: "Available",
        description: "Surplus loaves",
        providerLabel: "Provider abc123",
        distanceKm: 0.5,
        matchScore: 0.8,
        matchEligible: true,
        matchBreakdown: { distance: 1, quantity: 0.8, category: 1, urgency: 0.7 },
        pickupLocation: { address: "12 Clifton Road" },
        expiryDate: "2026-08-22T09:00:00.000Z",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/organization/food/food-1"]}>
        <ToastProvider>
          <Routes>
            <Route path="/organization/food/:listingId" element={<OrganizationFoodDetailsPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("12 Clifton Road")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Claim" })).toBeEnabled();
    expect(screen.getAllByText("Available").length).toBeGreaterThan(0);
    expect(screen.getAllByText("80%").length).toBeGreaterThan(0);
    expect(screen.getByText("Python matcher score")).toBeInTheDocument();
    expect(screen.getByText("Quantity fit")).toBeInTheDocument();
  });

  it("updates the listing status to Reserved after a successful claim", async () => {
    const available = {
      id: "food-1",
      foodName: "Vegetarian meal",
      category: "Prepared",
      quantity: 20,
      unit: "servings",
      status: "Available",
      providerLabel: "Provider abc123",
      matchScore: 0.9,
      matchEligible: true,
      pickupLocation: { address: "12 Clifton Road" },
    };
    fetchListing.mockResolvedValue(available);
    fetchMyOrganization.mockResolvedValue({ id: "org-1", verified: true, location: { latitude: 24.86, longitude: 67 } });
    decorateWithMatchScores.mockResolvedValue([available]);
    claimListing.mockResolvedValue({
      listing: { ...available, status: "Reserved", reservedBy: "org-1" },
    });

    render(
      <MemoryRouter initialEntries={["/organization/food/food-1"]}>
        <ToastProvider>
          <Routes>
            <Route path="/organization/food/:listingId" element={<OrganizationFoodDetailsPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    await userEvent.click(await screen.findByRole("button", { name: "Claim" }));
    expect(claimListing).toHaveBeenCalledWith("food-1");
    expect(await screen.findAllByText("Reserved")).not.toHaveLength(0);
  });
});
