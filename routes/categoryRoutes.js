import express from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.get("/", getAllCategories);

// Admin routes (protected)
router.post("/", protect, authorize("admin", "super_admin"), createCategory);
router.put("/:id", protect, authorize("admin", "super_admin"), updateCategory);
router.delete(
  "/:id",
  protect,
  authorize("admin", "super_admin"),
  deleteCategory
);

export default router;
