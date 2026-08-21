import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewListingPage } from "./NewListingPage.jsx";
import { ToastProvider } from "../../context/ToastContext.jsx";

vi.mock("../../services/foodService.js", () => ({
  publishListing: vi.fn(),
}));

import { publishListing } from "../../services/foodService.js";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/provider/listings/new"]}>
      <ToastProvider>
        <Routes>
          <Route path="/provider/listings/new" element={<NewListingPage />} />
          <Route path="/provider/listings" element={<p>listings-refreshed</p>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe("NewListingPage", () => {
  it("validates before calling the API", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Publish listing" }));
    expect(await screen.findByText(/Food name must be at least 2 characters/)).toBeInTheDocument();
    expect(publishListing).not.toHaveBeenCalled();
  });

  it("POSTs a listing and shows Available confirmation via listings refresh", async () => {
    const user = userEvent.setup();
    publishListing.mockResolvedValue({
      id: "abc123",
      foodName: "Fresh bread",
      status: "Available",
    });

    renderPage();
    await user.type(screen.getByLabelText("Food name"), "Fresh bread");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "12");
    await user.type(screen.getByLabelText("Address"), "12 Clifton Road");
    await user.type(screen.getByLabelText("Latitude"), "24.86");
    await user.type(screen.getByLabelText("Longitude"), "67.00");
    await user.type(screen.getByLabelText("Available From"), "2026-08-21T09:00");
    await user.type(screen.getByLabelText("Available Until"), "2026-08-21T18:00");
    await user.type(screen.getByLabelText("Expiry Date"), "2026-08-22T09:00");
    await user.click(screen.getByRole("button", { name: "Publish listing" }));

    expect(await screen.findByText("listings-refreshed")).toBeInTheDocument();
    expect(publishListing).toHaveBeenCalledWith(
      expect.objectContaining({
        foodName: "Fresh bread",
        category: "Produce",
        quantity: 12,
        pickupLocation: expect.objectContaining({
          address: "12 Clifton Road",
        }),
      })
    );
  });

  it("surfaces API errors", async () => {
    const user = userEvent.setup();
    publishListing.mockRejectedValue(new Error("Validation failed"));
    renderPage();
    await user.type(screen.getByLabelText("Food name"), "Fresh bread");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "12");
    await user.type(screen.getByLabelText("Address"), "12 Clifton Road");
    await user.type(screen.getByLabelText("Latitude"), "24.86");
    await user.type(screen.getByLabelText("Longitude"), "67.00");
    await user.type(screen.getByLabelText("Available From"), "2026-08-21T09:00");
    await user.type(screen.getByLabelText("Available Until"), "2026-08-21T18:00");
    await user.type(screen.getByLabelText("Expiry Date"), "2026-08-22T09:00");
    await user.click(screen.getByRole("button", { name: "Publish listing" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Validation failed");
  });

  it("fills demo surplus values and publishes them", async () => {
    const user = userEvent.setup();
    publishListing.mockResolvedValue({
      id: "veg-1",
      foodName: "Vegetarian meal",
      status: "Available",
    });
    renderPage();
    await user.click(screen.getByRole("button", { name: "Fill demo surplus" }));
    await user.click(screen.getByRole("button", { name: "Publish listing" }));
    expect(await screen.findByText("listings-refreshed")).toBeInTheDocument();
    expect(publishListing).toHaveBeenCalledWith(
      expect.objectContaining({
        foodName: "Vegetarian meal",
        category: "Prepared",
        quantity: 30,
        pickupLocation: expect.objectContaining({
          address: "12 Rescue Street, Karachi",
        }),
      })
    );
  });
});
