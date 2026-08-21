import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { OrganizationFoodPage } from "./OrganizationFoodPage.jsx";
import { ToastProvider } from "../../context/ToastContext.jsx";

vi.mock("../../services/foodService.js", () => ({
  fetchFoods: vi.fn(),
  claimListing: vi.fn(),
}));

vi.mock("../../services/organizationService.js", () => ({
  fetchMyOrganization: vi.fn(),
}));

vi.mock("../../services/matchingService.js", () => ({
  decorateWithMatchScores: vi.fn(),
}));

import { fetchFoods } from "../../services/foodService.js";
import { fetchMyOrganization } from "../../services/organizationService.js";
import { decorateWithMatchScores } from "../../services/matchingService.js";

describe("OrganizationFoodPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("browses available listings with match scores", async () => {
    fetchMyOrganization.mockResolvedValue({
      id: "org-1",
      verified: true,
      location: { latitude: 24.86, longitude: 67 },
    });
    fetchFoods.mockResolvedValue([
      {
        id: "food-1",
        foodName: "Vegetarian meal",
        category: "Prepared",
        quantity: 30,
        unit: "servings",
        status: "Available",
        expiryDate: "2026-08-22T09:00:00.000Z",
        pickupLocation: { address: "12 Rescue Street", latitude: 24.86, longitude: 67 },
      },
    ]);
    decorateWithMatchScores.mockResolvedValue([
      {
        id: "food-1",
        foodName: "Vegetarian meal",
        category: "Prepared",
        quantity: 30,
        unit: "servings",
        status: "Available",
        matchScore: 0.81,
        matchEligible: true,
        distanceKm: 0.4,
        expiryDate: "2026-08-22T09:00:00.000Z",
        pickupLocation: { address: "12 Rescue Street", latitude: 24.86, longitude: 67 },
      },
    ]);

    render(
      <MemoryRouter>
        <ToastProvider>
          <OrganizationFoodPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Available Food" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vegetarian meal" })).toBeInTheDocument();
    expect(screen.getByText("30 servings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Claim" })).toBeEnabled();
    expect(fetchFoods).toHaveBeenCalled();
    expect(decorateWithMatchScores).toHaveBeenCalled();
  });

  it("shows an empty state when nothing matches the filters", async () => {
    fetchMyOrganization.mockResolvedValue({ id: "org-1", verified: true });
    fetchFoods.mockResolvedValue([]);
    decorateWithMatchScores.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <ToastProvider>
          <OrganizationFoodPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("No food matches these filters")).toBeInTheDocument();
  });
});
