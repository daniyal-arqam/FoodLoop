import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListingDetailsPage } from "./ListingDetailsPage.jsx";
import { ToastProvider } from "../../context/ToastContext.jsx";

vi.mock("../../services/foodService.js", () => ({
  fetchListing: vi.fn(),
  collectListing: vi.fn(),
}));

import { collectListing, fetchListing } from "../../services/foodService.js";

describe("ListingDetailsPage", () => {
  it("loads a listing from the API and shows Available status", async () => {
    fetchListing.mockResolvedValue({
      id: "abc123",
      foodName: "Fresh bread",
      category: "Bakery",
      quantity: 12,
      unit: "kg",
      description: "Surplus loaves",
      status: "Available",
      pickupLocation: { address: "12 Clifton Road", latitude: 24.86, longitude: 67 },
      availableFrom: "2026-08-21T09:00:00.000Z",
      availableUntil: "2026-08-21T18:00:00.000Z",
      expiryDate: "2026-08-22T09:00:00.000Z",
      claimedQuantity: 0,
    });

    render(
      <MemoryRouter initialEntries={["/provider/listings/abc123"]}>
        <ToastProvider>
          <Routes>
            <Route path="/provider/listings/:listingId" element={<ListingDetailsPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    expect((await screen.findAllByText("Fresh bread")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Available").length).toBeGreaterThan(0);
    expect(screen.getByText("12 Clifton Road")).toBeInTheDocument();
    expect(fetchListing).toHaveBeenCalledWith("abc123");
  });

  it("updates status to Collected after the provider completes pickup", async () => {
    fetchListing.mockResolvedValue({
      id: "abc123",
      foodName: "Vegetarian meal",
      category: "Prepared",
      quantity: 20,
      unit: "servings",
      status: "Reserved",
      pickupLocation: { address: "12 Clifton Road" },
      claimedQuantity: 20,
    });
    collectListing.mockResolvedValue({
      listing: { id: "abc123", foodName: "Vegetarian meal", status: "Collected" },
    });

    render(
      <MemoryRouter initialEntries={["/provider/listings/abc123"]}>
        <ToastProvider>
          <Routes>
            <Route path="/provider/listings/:listingId" element={<ListingDetailsPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    await userEvent.click(await screen.findByRole("button", { name: "Mark collected" }));
    expect(collectListing).toHaveBeenCalledWith("abc123");
    expect(await screen.findAllByText("Collected")).not.toHaveLength(0);
  });
});
