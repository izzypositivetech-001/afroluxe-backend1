import express from "express";
import {
  createCoupon,
  getAllCoupons,
  validateCoupon,
  deleteCoupon,
  updateCouponStatus,
} from "../controllers/couponController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/validate", validateCoupon);

// Admin routes
router.use(protect);
router.use(authorize("admin", "super_admin"));

router.route("/").get(getAllCoupons).post(createCoupon);

router.route("/:id").delete(deleteCoupon);

router.patch("/:id/status", updateCouponStatus);

export default router;
