export const USER_ROLES = {
  PROVIDER: "Provider",
  ORGANIZATION: "Organization",
  ADMIN: "Admin",
};

export const PUBLIC_REGISTRATION_ROLES = [USER_ROLES.PROVIDER, USER_ROLES.ORGANIZATION];

export const FOOD_CATEGORIES = [
  "Produce",
  "Bakery",
  "Dairy",
  "Prepared",
  "Canned",
  "Frozen",
  "Meat",
  "Other",
];

export const FOOD_UNITS = ["kg", "g", "L", "ml", "servings", "items", "boxes", "trays"];

export const FOOD_STATUSES = ["Available", "Reserved", "Collected", "Expired"];

export const TOKEN_STORAGE_KEY = "foodloop.accessToken";
export const THEME_STORAGE_KEY = "foodloop.theme";
