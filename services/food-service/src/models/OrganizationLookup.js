const mongoose = require("mongoose");

const organizationLookupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    organizationName: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "organizations",
    strict: false,
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.OrganizationLookup ||
  mongoose.model("OrganizationLookup", organizationLookupSchema);
