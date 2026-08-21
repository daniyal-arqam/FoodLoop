import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "../../context/ToastContext.jsx";
import { AdminListingDetailsPage } from "./AdminListingDetailsPage.jsx";

vi.mock("../../services/foodService.js", () => ({
  fetchListing: vi.fn(),
  updateFood: vi.fn(),
}));

import { fetchListing, updateFood } from "../../services/foodService.js";

describe("AdminListingDetailsPage", () => {
  it("loads listing status from the API and expires after confirmation", async () => {
    fetchListing.mockResolvedValue({
      id: "abc123",
      foodName: "Fresh bread",
      category: "Bakery",
      quantity: 12,
      unit: "kg",
      description: "Surplus loaves",
      status: "Available",
      pickupLocation: { address: "12 Clifton Road", latitude: 24.86, longitude: 67 },
      claimedQuantity: 0,
    });
    updateFood.mockResolvedValue({ data: { listing: { id: "abc123", status: "Expired" } } });

    render(
      <MemoryRouter initialEntries={["/admin/listings/abc123"]}>
        <ToastProvider>
          <Routes>
            <Route path="/admin/listings/:listingId" element={<AdminListingDetailsPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    expect((await screen.findAllByText("Fresh bread")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Available").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Mark expired" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Mark Fresh bread as expired");
    await userEvent.click(screen.getByRole("button", { name: "Expire listing" }));

    expect(updateFood).toHaveBeenCalledWith("abc123", { status: "Expired" });
  });
});
