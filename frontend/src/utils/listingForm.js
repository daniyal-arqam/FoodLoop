import { FOOD_CATEGORIES, FOOD_UNITS } from "./constants.js";

export function toDatetimeLocal(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function demoListingForm(now = new Date()) {
  const from = new Date(now.getTime() - 60 * 60 * 1000);
  const until = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const expiry = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  return {
    foodName: "Vegetarian meal",
    category: "Prepared",
    quantity: "30",
    unit: "servings",
    description: "Packed vegetarian trays for same-day rescue",
    address: "12 Rescue Street, Karachi",
    latitude: "24.8607",
    longitude: "67.0011",
    availableFrom: toDatetimeLocal(from),
    availableUntil: toDatetimeLocal(until),
    expiryDate: toDatetimeLocal(expiry),
  };
}

export function emptyListingForm() {
  return {
    foodName: "",
    category: FOOD_CATEGORIES[0],
    quantity: "",
    unit: FOOD_UNITS[0],
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    availableFrom: "",
    availableUntil: "",
    expiryDate: "",
  };
}

export function validateListingForm(form) {
  const errors = {};
  const foodName = String(form.foodName || "").trim();
  if (foodName.length < 2) {
    errors.foodName = "Food name must be at least 2 characters";
  }

  if (!FOOD_CATEGORIES.includes(form.category)) {
    errors.category = "Choose a valid category";
  }

  const quantity = Number(form.quantity);
  if (form.quantity === "" || Number.isNaN(quantity) || quantity <= 0) {
    errors.quantity = "Quantity must be greater than 0";
  }

  if (!FOOD_UNITS.includes(form.unit)) {
    errors.unit = "Choose a valid unit";
  }

  const address = String(form.address || "").trim();
  if (address.length < 3) {
    errors.address = "Address must be at least 3 characters";
  }

  const latitude = Number(form.latitude);
  if (form.latitude === "" || Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.latitude = "Latitude must be between -90 and 90";
  }

  const longitude = Number(form.longitude);
  if (form.longitude === "" || Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.longitude = "Longitude must be between -180 and 180";
  }

  const availableFrom = new Date(form.availableFrom);
  const availableUntil = new Date(form.availableUntil);
  const expiryDate = new Date(form.expiryDate);

  if (!form.availableFrom || Number.isNaN(availableFrom.getTime())) {
    errors.availableFrom = "Available from must be a valid date";
  }
  if (!form.availableUntil || Number.isNaN(availableUntil.getTime())) {
    errors.availableUntil = "Available until must be a valid date";
  }
  if (!form.expiryDate || Number.isNaN(expiryDate.getTime())) {
    errors.expiryDate = "Expiry date must be a valid date";
  }
  if (!errors.availableFrom && !errors.availableUntil && availableUntil < availableFrom) {
    errors.availableUntil = "Available until must be after available from";
  }

  return errors;
}

export function toCreateListingPayload(form) {
  return {
    foodName: String(form.foodName).trim(),
    category: form.category,
    quantity: Number(form.quantity),
    unit: form.unit,
    description: String(form.description || "").trim(),
    pickupLocation: {
      address: String(form.address).trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    },
    availableFrom: new Date(form.availableFrom).toISOString(),
    availableUntil: new Date(form.availableUntil).toISOString(),
    expiryDate: new Date(form.expiryDate).toISOString(),
  };
}
