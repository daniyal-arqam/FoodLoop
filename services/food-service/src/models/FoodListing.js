const mongoose = require("mongoose");
const {
  FOOD_CATEGORIES,
  FOOD_STATUS_VALUES,
  FOOD_STATUSES,
  FOOD_UNITS,
} = require("../../../shared/constants");

const pickupLocationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: [true, "pickupLocation.address is required"],
      trim: true,
      minlength: [3, "pickupLocation.address must be at least 3 characters"],
      maxlength: [300, "pickupLocation.address must be at most 300 characters"],
    },
    latitude: {
      type: Number,
      required: [true, "pickupLocation.latitude is required"],
      min: [-90, "latitude must be between -90 and 90"],
      max: [90, "latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      required: [true, "pickupLocation.longitude is required"],
      min: [-180, "longitude must be between -180 and 180"],
      max: [180, "longitude must be between -180 and 180"],
    },
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: undefined,
    },
  },
  { _id: false }
);

pickupLocationSchema.pre("validate", function syncGeoJson(next) {
  this.type = "Point";
  this.coordinates = [this.longitude, this.latitude];
  next();
});

const foodListingSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "providerId is required"],
      index: true,
    },
    foodName: {
      type: String,
      required: [true, "foodName is required"],
      trim: true,
      minlength: [2, "foodName must be at least 2 characters"],
      maxlength: [120, "foodName must be at most 120 characters"],
    },
    category: {
      type: String,
      required: [true, "category is required"],
      enum: {
        values: FOOD_CATEGORIES,
        message: "category {VALUE} is not a valid food category",
      },
    },
    quantity: {
      type: Number,
      required: [true, "quantity is required"],
      min: [0.01, "quantity must be greater than 0"],
    },
    unit: {
      type: String,
      required: [true, "unit is required"],
      enum: {
        values: FOOD_UNITS,
        message: "unit {VALUE} is not a valid unit",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "description must be at most 1000 characters"],
      default: "",
    },
    pickupLocation: {
      type: pickupLocationSchema,
      required: [true, "pickupLocation is required"],
    },
    availableFrom: {
      type: Date,
      required: [true, "availableFrom is required"],
    },
    availableUntil: {
      type: Date,
      required: [true, "availableUntil is required"],
    },
    expiryDate: {
      type: Date,
      required: [true, "expiryDate is required"],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: FOOD_STATUS_VALUES,
        message: "status {VALUE} is not a valid food status",
      },
      default: FOOD_STATUSES.AVAILABLE,
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    claimedQuantity: {
      type: Number,
      default: 0,
      min: [0, "claimedQuantity cannot be negative"],
    },
  },
  {
    timestamps: true,
    collection: "food_listings",
    strict: true,
    versionKey: false,
  }
);

foodListingSchema.pre("validate", function validateListing(next) {
  if (this.availableUntil && this.availableFrom && this.availableUntil < this.availableFrom) {
    this.invalidate("availableUntil", "availableUntil must be on or after availableFrom");
  }

  if (this.expiryDate && this.availableFrom && this.expiryDate < this.availableFrom) {
    this.invalidate("expiryDate", "expiryDate must be on or after availableFrom");
  }

  if (this.claimedQuantity > this.quantity) {
    this.invalidate("claimedQuantity", "claimedQuantity cannot exceed quantity");
  }

  if (this.status === FOOD_STATUSES.AVAILABLE && this.reservedBy) {
    this.invalidate("reservedBy", "Available listings cannot have reservedBy set");
  }

  if (
    (this.status === FOOD_STATUSES.RESERVED || this.status === FOOD_STATUSES.COLLECTED) &&
    !this.reservedBy
  ) {
    this.invalidate("reservedBy", "reservedBy is required when status is Reserved or Collected");
  }

  next();
});

foodListingSchema.index({ status: 1, category: 1, expiryDate: 1 });
foodListingSchema.index({ status: 1, availableUntil: 1 });
foodListingSchema.index({ providerId: 1, status: 1, createdAt: -1 });
foodListingSchema.index({ category: 1, status: 1, quantity: 1 });
foodListingSchema.index({ foodName: "text", description: "text" });
foodListingSchema.index({ pickupLocation: "2dsphere" });

module.exports =
  mongoose.models.FoodListing || mongoose.model("FoodListing", foodListingSchema);
