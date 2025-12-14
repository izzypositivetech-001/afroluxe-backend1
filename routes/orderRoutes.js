import express from "express";
import {
  createOrder,
  getOrderById,
  trackOrder,
  lookupOrdersByEmail,
  cancelOrder,
} from "../controllers/orderController.js";
import { validateCheckout } from "../middleware/orderValidation.js";

const router = express.Router();

// Specific routes MUST come before parameterized routes
router.post("/", validateCheckout, createOrder);
router.get("/lookup", lookupOrdersByEmail);
router.get("/track/:orderId", trackOrder);
router.post("/:orderId/cancel", cancelOrder);
router.get("/:orderId", getOrderById);

export default router;
