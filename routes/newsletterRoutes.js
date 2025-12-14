import express from "express";
import {
  subscribe,
  unsubscribe,
  getSubscribers,
} from "../controllers/newsletterController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);

// Admin routes (super_admin only)
router.get("/subscribers", protect, authorize("super_admin"), getSubscribers);

export default router;
