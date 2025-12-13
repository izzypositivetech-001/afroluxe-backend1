import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";
import { sendAdminRegistrationNotification } from "../services/emailService.js";

/**
 * Generate JWT Token
 */
const generateToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * @desc    Register admin
 * @route   POST /api/auth/register
 * @access  Public (but first admin becomes super admin, others need approval)
 */
export const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const language = req.language || "en";

    // Validation
    if (!name || !email || !password) {
      return ResponseHandler.error(
        res,
        400,
        "Please provide all required fields"
      );
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return ResponseHandler.error(res, 400, "Email already registered");
    }

    // Validate password length
    if (password.length < 8) {
      return ResponseHandler.error(
        res,
        400,
        "Password must be at least 8 characters"
      );
    }

    // Check if this is the first admin
    const adminCount = await Admin.countDocuments();

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (adminCount === 0) {
      // FIRST ADMIN - Becomes Super Admin (Active immediately)
      const admin = await Admin.create({
        name,
        email,
        password: hashedPassword,
        role: "super_admin",
        status: "active", // Active immediately
        approvedBy: null,
        approvedAt: new Date(), // Auto-approved
      });

      // Generate token for first admin
      const token = generateToken(admin._id);

      return ResponseHandler.success(
        res,
        201,
        "Super admin account created successfully",
        {
          token,
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            status: admin.status,
          },
        }
      );
    } else {
      // SUBSEQUENT ADMINS - Need approval (Pending)
      const admin = await Admin.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
        status: "pending", // Pending approval
        approvedBy: null,
        approvedAt: null,
      });

      // Send notification email to super admin
      try {
        const superAdmin = await Admin.findOne({
          role: "super_admin",
          status: "active",
        });
        if (superAdmin) {
          await sendAdminRegistrationNotification(admin, superAdmin.email);
        }
      } catch (emailError) {
        // Don't fail registration if email fails
        console.error("Failed to send notification email:", emailError);
      }

      return ResponseHandler.success(
        res,
        201,
        "Registration successful. Your account is pending approval from the super administrator.",
        {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            status: admin.status,
          },
          message:
            "You will receive an email notification once your account is approved.",
        }
      );
    }
  } catch (error) {
    console.error("Error registering admin:", error);
    next(error);
  }
};

/**
 * @desc    Login admin
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const language = req.language || "en";

    // Validation
    if (!email || !password) {
      return ResponseHandler.error(
        res,
        400,
        "Please provide email and password"
      );
    }

    // Find admin and include password
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return ResponseHandler.error(res, 401, "Invalid credentials");
    }

    // Check if admin is active
    if (admin.status !== "active") {
      if (admin.status === "pending") {
        return ResponseHandler.error(
          res,
          403,
          "Your account is pending approval. Please contact the super administrator."
        );
      } else if (admin.status === "suspended") {
        return ResponseHandler.error(
          res,
          403,
          "Your account has been suspended. Please contact the super administrator."
        );
      }
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, admin.password);

    if (!isPasswordCorrect) {
      return ResponseHandler.error(res, 401, "Invalid credentials");
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    return ResponseHandler.success(
      res,
      200,
      getMessage("LOGIN_SUCCESS", language),
      {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          status: admin.status,
          lastLoginAt: admin.lastLoginAt,
        },
      }
    );
  } catch (error) {
    console.error("Error logging in admin:", error);
    next(error);
  }
};

/**
 * @desc    Get current admin profile
 * @route   GET /api/auth/me
 * @access  Private (Admin only)
 */
export const getAdminProfile = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // req.admin is set by protect middleware
    const admin = await Admin.findById(req.admin._id).select("-password");

    if (!admin) {
      return ResponseHandler.error(res, 404, "Admin not found");
    }

    return ResponseHandler.success(res, 200, getMessage("SUCCESS", language), {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Error getting admin profile:", error);
    next(error);
  }
};

/**
 * @desc    Logout admin
 * @route   POST /api/auth/logout
 * @access  Private (Admin only)
 */
export const logoutAdmin = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // In a stateless JWT system, logout is handled client-side
    // by removing the token from localStorage
    // This endpoint is optional but good for logging purposes

    return ResponseHandler.success(res, 200, "Logged out successfully", {
      message: "Please remove the token from client storage",
    });
  } catch (error) {
    console.error("Error logging out admin:", error);
    next(error);
  }
};
