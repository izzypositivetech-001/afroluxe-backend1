import express from "express";
import {
  createIntent,
  confirmPayment,
  verifyPayment,
  getPaymentMethods,
  getPaymentStatus,
  refundPayment,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  validateCreateIntent,
  validateConfirmPayment,
  validateRefund,
} from "../middleware/paymentValidation.js";

import { handleStripeWebhook } from "../webhooks/stripeWebhooks.js";

const router = express.Router();

// Public routes
router.post("/create-intent", validateCreateIntent, createIntent);
router.post("/confirm", validateConfirmPayment, confirmPayment);
router.get("/status/:paymentIntentId", getPaymentStatus);
router.get("/verify/:paymentIntentId", verifyPayment);
router.get("/methods", getPaymentMethods);

// Webhook route (no auth - verified by Stripe signature)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Admin routes
router.post(
  "/refund",
  protect,
  authorize("super_admin", "admin"),
  validateRefund,
  refundPayment
);

export default router;
