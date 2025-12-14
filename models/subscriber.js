import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: ["homepage", "footer", "checkout", "popup", "other"],
      default: "homepage",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
subscriberSchema.index({ email: 1 });
subscriberSchema.index({ status: 1 });

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

export default Subscriber;
