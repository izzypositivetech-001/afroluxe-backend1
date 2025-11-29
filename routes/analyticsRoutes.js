import express from "express";
import {
  getDashboardOverview,
  getRevenueAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  getSalesTrends,
  exportAnalyticsReport,
} from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize("super_admin", "admin"));

// Dashboard overview
router.get("/dashboard", getDashboardOverview);

// Revenue analytics
router.get("/revenue", getRevenueAnalytics);

// Product analytics
router.get("/products", getProductAnalytics);

// Customer analytics
router.get("/customers", getCustomerAnalytics);

// Sales trends
router.get("/trends", getSalesTrends);

// Sales analytics (alias for trends - for frontend compatibility)
router.get("/sales", getSalesTrends);

// Top products (alias for product analytics)
router.get("/top-products", getProductAnalytics);

// Export report
router.get("/export", exportAnalyticsReport);

export default router;
