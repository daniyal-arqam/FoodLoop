import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClaimButton } from "./ClaimButton.jsx";
import { ToastProvider } from "../../context/ToastContext.jsx";
import { ApiError } from "../../utils/errors.js";

vi.mock("../../services/foodService.js", () => ({
  claimListing: vi.fn(),
}));

import { claimListing } from "../../services/foodService.js";

function renderButton(listing, verified = true) {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ClaimButton listing={listing} verified={verified} />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe("ClaimButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("calls POST claim for a verified organization", async () => {
    const user = userEvent.setup();
    claimListing.mockResolvedValue({ listing: { status: "Reserved" } });
    renderButton({ id: "food-1", status: "Available" }, true);
    await user.click(screen.getByRole("button", { name: "Claim" }));
    expect(claimListing).toHaveBeenCalledWith("food-1");
    expect(await screen.findByText(/Claim recorded/)).toBeInTheDocument();
  });

  it("blocks unverified organizations without calling the API", async () => {
    renderButton({ id: "food-1", status: "Available" }, false);
    expect(screen.getByRole("button", { name: "Claim" })).toBeDisabled();
    expect(screen.getByText(/must be verified/)).toBeInTheDocument();
    expect(claimListing).not.toHaveBeenCalled();
  });

  it("surfaces already reserved errors", async () => {
    const user = userEvent.setup();
    claimListing.mockRejectedValue(new ApiError("Reserved listings cannot be claimed again", 409));
    renderButton({ id: "food-1", status: "Available" }, true);
    await user.click(screen.getByRole("button", { name: "Claim" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/already reserved/);
  });

  it("surfaces expired listing errors", async () => {
    const user = userEvent.setup();
    claimListing.mockRejectedValue(new ApiError("Expired listings cannot be claimed", 409));
    renderButton({ id: "food-1", status: "Available" }, true);
    await user.click(screen.getByRole("button", { name: "Claim" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/expired/);
  });
});
