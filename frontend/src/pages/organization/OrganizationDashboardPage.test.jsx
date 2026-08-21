import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "../../context/ToastContext.jsx";
import { OrganizationDashboardPage } from "./OrganizationDashboardPage.jsx";

vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => ({ user: { id: "user-1", name: "Kitchen", role: "Organization" } }),
}));

vi.mock("../../services/foodService.js", () => ({
  fetchFoods: vi.fn(),
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

describe("OrganizationDashboardPage", () => {
  it("shows live counts for available food, matches, claims, and collected listings", async () => {
    fetchMyOrganization.mockResolvedValue({
      id: "org-1",
      verified: true,
      location: { latitude: 24.86, longitude: 67 },
    });
    fetchFoods.mockImplementation(async (query = {}) => {
      if (query.status === "Reserved") {
        return [{ id: "r1", foodName: "Milk", status: "Reserved", reservedBy: "org-1", updatedAt: "2026-08-21T10:00:00.000Z" }];
      }
      if (query.status === "Collected") {
        return [{ id: "c1", foodName: "Rice", status: "Collected", reservedBy: "org-1", updatedAt: "2026-08-20T10:00:00.000Z" }];
      }
      return [
        {
          id: "a1",
          foodName: "Bread",
          category: "Bakery",
          quantity: 8,
          unit: "kg",
          status: "Available",
          providerId: "prov-1",
          expiryDate: "2026-08-22T00:00:00.000Z",
          pickupLocation: { latitude: 24.86, longitude: 67 },
        },
      ];
    });
    decorateWithMatchScores.mockResolvedValue([
      {
        id: "a1",
        foodName: "Bread",
        category: "Bakery",
        quantity: 8,
        unit: "kg",
        status: "Available",
        providerLabel: "Provider prov-1",
        distanceKm: 1.2,
        matchScore: 0.91,
        matchEligible: true,
        expiryDate: "2026-08-22T00:00:00.000Z",
      },
    ]);

    render(
      <MemoryRouter>
        <ToastProvider>
          <OrganizationDashboardPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Available Food")).toBeInTheDocument();
    expect(screen.getAllByText("Recommended Matches").length).toBeGreaterThan(0);
    expect(screen.getByText("Active Claims")).toBeInTheDocument();
    expect(screen.getByText("Collected Food")).toBeInTheDocument();
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getAllByText("Bread").length).toBeGreaterThan(0);
  });
});
