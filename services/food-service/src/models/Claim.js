const mongoose = require("mongoose");
const { CLAIM_STATUS_VALUES, CLAIM_STATUSES } = require("../../../shared/constants");

const claimSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodListing",
      required: [true, "listingId is required"],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "organizationId is required"],
    },
    quantity: {
      type: Number,
      required: [true, "quantity is required"],
      min: [0.01, "quantity must be greater than 0"],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: CLAIM_STATUS_VALUES,
        message: "status {VALUE} is not a valid claim status",
      },
      default: CLAIM_STATUSES.RESERVED,
    },
    claimedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    collectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "claims",
    strict: true,
    versionKey: false,
  }
);

claimSchema.pre("validate", function validateClaim(next) {
  if (this.status === CLAIM_STATUSES.COLLECTED && !this.collectedAt) {
    this.invalidate("collectedAt", "collectedAt is required when status is Collected");
  }

  if (this.status !== CLAIM_STATUSES.COLLECTED && this.collectedAt) {
    this.invalidate("collectedAt", "collectedAt is only allowed when status is Collected");
  }

  next();
});

claimSchema.index({ listingId: 1, organizationId: 1 });
claimSchema.index({ organizationId: 1, status: 1, claimedAt: -1 });
claimSchema.index({ listingId: 1, status: 1 });
claimSchema.index(
  { listingId: 1, organizationId: 1 },
  {
    unique: true,
    name: "unique_active_claim_per_org_listing",
    partialFilterExpression: { status: CLAIM_STATUSES.RESERVED },
  }
);

module.exports = mongoose.models.Claim || mongoose.model("Claim", claimSchema);
