import express from "express";
import {
  getPendingAdmins,
  getAllAdmins,
  approveAdmin,
  rejectAdmin,
  suspendAdmin,
  reactivateAdmin,
  deleteAdmin,
  getAdminStats,
} from "../controllers/adminManagementController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isSuperAdmin } from "../middleware/isSuperAdmin.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get admin statistics (All admins)
router.get("/stats", getAdminStats);

// Get all admins (All admins)
router.get("/all", getAllAdmins);

// Get pending admin requests (Super Admin only)
router.get("/pending", isSuperAdmin, getPendingAdmins);

// Approve pending admin (Super Admin only)
router.put("/approve/:adminId", isSuperAdmin, approveAdmin);

// Reject pending admin (Super Admin only)
router.delete("/reject/:adminId", isSuperAdmin, rejectAdmin);

// Suspend active admin (Super Admin only)
router.put("/suspend/:adminId", isSuperAdmin, suspendAdmin);

// Reactivate suspended admin (Super Admin only)
router.put("/reactivate/:adminId", isSuperAdmin, reactivateAdmin);

// Delete admin account (Super Admin only)
router.delete("/delete/:adminId", isSuperAdmin, deleteAdmin);

export default router;
