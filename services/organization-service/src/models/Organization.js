const mongoose = require("mongoose");
const { FOOD_CATEGORIES } = require("../../../shared/constants");

const locationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: [true, "location.latitude is required"],
      min: [-90, "latitude must be between -90 and 90"],
      max: [90, "latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      required: [true, "location.longitude is required"],
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

locationSchema.pre("validate", function syncGeoJson(next) {
  this.type = "Point";
  this.coordinates = [this.longitude, this.latitude];
  next();
});

const organizationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      unique: true,
    },
    organizationName: {
      type: String,
      required: [true, "organizationName is required"],
      trim: true,
      minlength: [2, "organizationName must be at least 2 characters"],
      maxlength: [160, "organizationName must be at most 160 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "description must be at most 1000 characters"],
      default: "",
    },
    address: {
      type: String,
      required: [true, "address is required"],
      trim: true,
      minlength: [3, "address must be at least 3 characters"],
      maxlength: [300, "address must be at most 300 characters"],
    },
    location: {
      type: locationSchema,
      required: [true, "location is required"],
    },
    foodCategoriesNeeded: {
      type: [
        {
          type: String,
          enum: {
            values: FOOD_CATEGORIES,
            message: "{VALUE} is not a valid food category",
          },
        },
      ],
      required: [true, "foodCategoriesNeeded is required"],
      validate: {
        validator(categories) {
          return Array.isArray(categories) && categories.length > 0;
        },
        message: "foodCategoriesNeeded must include at least one category",
      },
    },
    requiredQuantity: {
      type: Number,
      required: [true, "requiredQuantity is required"],
      min: [0, "requiredQuantity cannot be negative"],
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "organizations",
    strict: true,
    versionKey: false,
  }
);

organizationSchema.index({ verified: 1, foodCategoriesNeeded: 1 });
organizationSchema.index({ organizationName: 1 });
organizationSchema.index({ location: "2dsphere" });

module.exports =
  mongoose.models.Organization || mongoose.model("Organization", organizationSchema);
