import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Please provide a coupon code"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Please provide a discount type"],
    },
    discountValue: {
      type: Number,
      required: [true, "Please provide a discount value"],
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: null, // No limit
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, "Please provide an expiration date"],
    },
    usageLimit: {
      type: Number,
      default: null, // Unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookup
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiryDate: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
