import Admin from "../models/admin.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";
import {
  sendApprovalEmail,
  sendRejectionEmail,
  sendSuspensionEmail,
} from "../services/emailService.js";

/**
 * @desc    Get all pending admin requests
 * @route   GET /api/admin/pending
 * @access  Private (Super Admin only)
 */
export const getPendingAdmins = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // Find all pending admins
    const pendingAdmins = await Admin.find({ status: "pending" })
      .select("-password")
      .sort({ createdAt: -1 }); // Newest first

    return ResponseHandler.success(res, 200, getMessage("SUCCESS", language), {
      count: pendingAdmins.length,
      admins: pendingAdmins,
    });
  } catch (error) {
    console.error("Error fetching pending admins:", error);
    next(error);
  }
};

/**
 * @desc    Get all admins (active, pending, suspended)
 * @route   GET /api/admin/all
 * @access  Private (Super Admin only)
 */
export const getAllAdmins = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // Find all admins
    const admins = await Admin.find()
      .select("-password")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    // Count by status
    const stats = {
      total: admins.length,
      active: admins.filter((a) => a.status === "active").length,
      pending: admins.filter((a) => a.status === "pending").length,
      suspended: admins.filter((a) => a.status === "suspended").length,
      superAdmins: admins.filter((a) => a.role === "super_admin").length,
      regularAdmins: admins.filter((a) => a.role === "admin").length,
    };

    return ResponseHandler.success(res, 200, getMessage("SUCCESS", language), {
      stats,
      admins,
    });
  } catch (error) {
    console.error("Error fetching all admins:", error);
    next(error);
  }
};

/**
 * @desc    Approve pending admin
 * @route   PUT /api/admin/approve/:adminId
 * @access  Private (Super Admin only)
 */
export const approveAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const language = req.language || "en";

    // Find the pending admin
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return ResponseHandler.error(res, 404, "Admin not found");
    }

    // Check if already approved
    if (admin.status === "active") {
      return ResponseHandler.error(res, 400, "Admin is already active");
    }

    // Check if pending
    if (admin.status !== "pending") {
      return ResponseHandler.error(
        res,
        400,
        `Cannot approve admin with status: ${admin.status}`
      );
    }

    // Update admin status
    admin.status = "active";
    admin.approvedBy = req.admin.id; // Current super admin
    admin.approvedAt = new Date();
    await admin.save();

    // Send approval email to admin
    try {
      await sendApprovalEmail(admin);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    const approvedAdmin = await Admin.findById(adminId)
      .select("-password")
      .populate("approvedBy", "name email");

    return ResponseHandler.success(res, 200, "Admin approved successfully", {
      admin: approvedAdmin,
      message: `${admin.name} can now login to the admin panel`,
    });
  } catch (error) {
    console.error("Error approving admin:", error);
    next(error);
  }
};

/**
 * @desc    Reject and delete pending admin
 * @route   DELETE /api/admin/reject/:adminId
 * @access  Private (Super Admin only)
 */
export const rejectAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const language = req.language || "en";

    // Find the pending admin
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return ResponseHandler.error(res, 404, "Admin not found");
    }

    // Check if pending
    if (admin.status !== "pending") {
      return ResponseHandler.error(
        res,
        400,
        "Can only reject pending admin requests"
      );
    }

    const adminName = admin.name;
    const adminEmail = admin.email;

    // Send rejection email before deleting
    try {
      await sendRejectionEmail(admin);
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }

    // Delete the admin
    await Admin.findByIdAndDelete(adminId);

    return ResponseHandler.success(res, 200, "Admin request rejected", {
      message: `Rejected and removed admin request from ${adminName} (${adminEmail})`,
    });
  } catch (error) {
    console.error("Error rejecting admin:", error);
    next(error);
  }
};

/**
 * @desc    Suspend active admin
 * @route   PUT /api/admin/suspend/:adminId
 * @access  Private (Super Admin only)
 */
export const suspendAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const language = req.language || "en";

    // Prevent suspending yourself
    if (adminId === req.admin.id.toString()) {
      return ResponseHandler.error(res, 400, "Cannot suspend your own account");
    }

    // Find the admin
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return ResponseHandler.error(res, 404, "Admin not found");
    }

    // Check if active
    if (admin.status !== "active") {
      return ResponseHandler.error(res, 400, "Admin is not active");
    }

    // Prevent suspending other super admins
    if (admin.role === "super_admin") {
      return ResponseHandler.error(
        res,
        403,
        "Cannot suspend super administrators"
      );
    }

    // Update admin status
    admin.status = "suspended";
    await admin.save();

    // Send suspension email to admin
    try {
      await sendSuspensionEmail(admin);
    } catch (emailError) {
      console.error("Failed to send suspension email:", emailError);
    }

    const suspendedAdmin = await Admin.findById(adminId).select("-password");

    return ResponseHandler.success(res, 200, "Admin suspended successfully", {
      admin: suspendedAdmin,
      message: `${admin.name} has been suspended and cannot login`,
    });
  } catch (error) {
    console.error("Error suspending admin:", error);
    next(error);
  }
};

/**
 * @desc    Reactivate suspended admin
 * @route   PUT /api/admin/reactivate/:adminId
 * @access  Private (Super Admin only)
 */
export const reactivateAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const language = req.language || "en";

    // Find the admin
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return ResponseHandler.error(res, 404, "Admin not found");
    }

    // Check if suspended
    if (admin.status !== "suspended") {
      return ResponseHandler.error(res, 400, "Admin is not suspended");
    }

    // Update admin status
    admin.status = "active";
    await admin.save();

    // TODO: Send reactivation email to admin
    // await sendReactivationEmail(admin);

    const reactivatedAdmin = await Admin.findById(adminId).select("-password");

    return ResponseHandler.success(res, 200, "Admin reactivated successfully", {
      admin: reactivatedAdmin,
      message: `${admin.name} can now login again`,
    });
  } catch (error) {
    console.error("Error reactivating admin:", error);
    next(error);
  }
};

/**
 * @desc    Delete admin account
 * @route   DELETE /api/admin/delete/:adminId
 * @access  Private (Super Admin only)
 */
export const deleteAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;
    const language = req.language || "en";

    // Prevent deleting yourself
    if (adminId === req.admin.id.toString()) {
      return ResponseHandler.error(res, 400, "Cannot delete your own account");
    }

    // Find the admin
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return ResponseHandler.error(res, 404, "Admin not found");
    }

    // Prevent deleting other super admins
    if (admin.role === "super_admin") {
      return ResponseHandler.error(
        res,
        403,
        "Cannot delete super administrators"
      );
    }

    // Check if this is the last admin (excluding super admins)
    const activeAdminCount = await Admin.countDocuments({ status: "active" });

    if (activeAdminCount === 1) {
      return ResponseHandler.error(
        res,
        400,
        "Cannot delete the last active admin. System must have at least one admin."
      );
    }

    const adminName = admin.name;
    const adminEmail = admin.email;

    // Delete the admin
    await Admin.findByIdAndDelete(adminId);

    return ResponseHandler.success(res, 200, "Admin deleted successfully", {
      message: `Deleted admin: ${adminName} (${adminEmail})`,
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    next(error);
  }
};

/**
 * @desc    Get admin management statistics
 * @route   GET /api/admin/stats
 * @access  Private (Super Admin only)
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const language = req.language || "en";

    const totalAdmins = await Admin.countDocuments();
    const activeAdmins = await Admin.countDocuments({ status: "active" });
    const pendingAdmins = await Admin.countDocuments({ status: "pending" });
    const suspendedAdmins = await Admin.countDocuments({ status: "suspended" });
    const superAdmins = await Admin.countDocuments({ role: "super_admin" });

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await Admin.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Last login activity
    const recentlyActive = await Admin.countDocuments({
      lastLoginAt: { $gte: sevenDaysAgo },
      status: "active",
    });

    return ResponseHandler.success(res, 200, getMessage("SUCCESS", language), {
      stats: {
        total: totalAdmins,
        active: activeAdmins,
        pending: pendingAdmins,
        suspended: suspendedAdmins,
        superAdmins,
        recentRegistrations,
        recentlyActive,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    next(error);
  }
};
