import ResponseHandler from "../utils/responseHandler.js";

/**
 * Middleware to check if authenticated user is a super admin
 * Must be used after 'protect' middleware
 */
export const isSuperAdmin = (req, res, next) => {
  try {
    // Check if admin exists (set by protect middleware)
    if (!req.admin) {
      return ResponseHandler.error(res, 401, "Not authenticated");
    }

    // Check if admin role is super_admin
    if (req.admin.role !== "super_admin") {
      return ResponseHandler.error(
        res,
        403,
        "Access denied. Super admin privileges required."
      );
    }

    // User is super admin, proceed
    next();
  } catch (error) {
    console.error("Super admin middleware error:", error);
    return ResponseHandler.error(res, 500, "Server error in authorization");
  }
};

export default isSuperAdmin;
