const mongoose = require("mongoose");
const { USER_ROLE_VALUES } = require("../../../shared/constants");

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$.{53}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      minlength: [2, "name must be at least 2 characters"],
      maxlength: [100, "name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "email must be at most 254 characters"],
      match: [EMAIL_PATTERN, "email must be a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "passwordHash is required"],
      select: false,
      validate: {
        validator(value) {
          return BCRYPT_HASH_PATTERN.test(value);
        },
        message: "passwordHash must be a bcrypt hash, not a plaintext password",
      },
    },
    role: {
      type: String,
      required: [true, "role is required"],
      enum: {
        values: USER_ROLE_VALUES,
        message: "role must be one of: {VALUE} is invalid",
      },
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, "phone must be at most 20 characters"],
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
    strict: true,
    versionKey: false,
  }
);

userSchema.index({ role: 1, isActive: 1 });

userSchema.set("toJSON", {
  transform(_doc, ret) {
    const serialized = { ...ret };
    delete serialized.passwordHash;
    return serialized;
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
