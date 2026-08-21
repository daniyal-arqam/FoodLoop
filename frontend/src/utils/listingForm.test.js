import { describe, expect, it } from "vitest";
import { emptyListingForm, toCreateListingPayload, validateListingForm, demoListingForm } from "./listingForm.js";

function validForm() {
  return {
    foodName: "Fresh bread",
    category: "Bakery",
    quantity: "12",
    unit: "kg",
    description: "Same-day bakery surplus",
    address: "12 Clifton Road",
    latitude: "24.86",
    longitude: "67.00",
    availableFrom: "2026-08-21T09:00",
    availableUntil: "2026-08-21T18:00",
    expiryDate: "2026-08-22T09:00",
  };
}

describe("listing form validation", () => {
  it("accepts a complete listing and maps the POST body", () => {
    const form = validForm();
    expect(validateListingForm(form)).toEqual({});
    expect(toCreateListingPayload(form)).toMatchObject({
      foodName: "Fresh bread",
      category: "Bakery",
      quantity: 12,
      unit: "kg",
      pickupLocation: {
        address: "12 Clifton Road",
        latitude: 24.86,
        longitude: 67,
      },
    });
  });

  it("rejects missing name, quantity, address, and coordinates", () => {
    const errors = validateListingForm(emptyListingForm());
    expect(errors.foodName).toMatch(/at least 2 characters/);
    expect(errors.quantity).toMatch(/greater than 0/);
    expect(errors.address).toMatch(/at least 3 characters/);
    expect(errors.latitude).toMatch(/Latitude/);
    expect(errors.longitude).toMatch(/Longitude/);
    expect(errors.availableFrom).toBeTruthy();
    expect(errors.expiryDate).toBeTruthy();
  });

  it("builds a valid demo surplus payload", () => {
    const form = demoListingForm(new Date("2026-08-21T12:00:00"));
    expect(validateListingForm(form)).toEqual({});
    expect(toCreateListingPayload(form)).toMatchObject({
      foodName: "Vegetarian meal",
      category: "Prepared",
      quantity: 30,
      unit: "servings",
      pickupLocation: {
        address: "12 Rescue Street, Karachi",
        latitude: 24.8607,
        longitude: 67.0011,
      },
    });
  });
});
