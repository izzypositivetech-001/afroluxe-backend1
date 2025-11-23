import Admin from '../models/Admin.js';
import ResponseHandler from '../utils/responseHandler.js';
import { getMessage } from '../utils/translations.js';
import { generateToken } from '../utils/generateToken.js';

/**
 * Register new admin (Super Admin only)
 * POST /api/auth/register
 */
export const registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const language = req.language || 'en';

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return ResponseHandler.error(
        res,
        400,
        language === 'en' ? 'Email already in use' : 'E-post allerede i bruk'
      );
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password,
      role: role || 'admin'
    });

    // Generate token
    const token = generateToken(admin._id, admin.role);

    // Remove password from response
    const adminResponse = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt
    };

    return ResponseHandler.success(
      res,
      201,
      getMessage('CREATED', language),
      {
        admin: adminResponse,
        token
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Login admin
 * POST /api/auth/login
 */
export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const language = req.language || 'en';

    // Validate input
    if (!email || !password) {
      return ResponseHandler.error(
        res,
        400,
        language === 'en' 
          ? 'Please provide email and password' 
          : 'Vennligst oppgi e-post og passord'
      );
    }

    // Find admin with password field
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return ResponseHandler.error(
        res,
        401,
        getMessage('INVALID_CREDENTIALS', language)
      );
    }

    // Check if admin is active
    if (!admin.isActive) {
      return ResponseHandler.error(
        res,
        401,
        language === 'en' 
          ? 'Account is deactivated' 
          : 'Konto er deaktivert'
      );
    }

    // Check password
    const isPasswordMatch = await admin.comparePassword(password);

    if (!isPasswordMatch) {
      return ResponseHandler.error(
        res,
        401,
        getMessage('INVALID_CREDENTIALS', language)
      );
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id, admin.role);

    // Remove password from response
    const adminResponse = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin
    };

    return ResponseHandler.success(
      res,
      200,
      getMessage('LOGIN_SUCCESS', language),
      {
        admin: adminResponse,
        token
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get current admin profile
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const language = req.language || 'en';

    // req.admin is set by auth middleware
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return ResponseHandler.error(
        res,
        404,
        language === 'en' ? 'Admin not found' : 'Admin ikke funnet'
      );
    }

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      admin
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Logout admin
 * POST /api/auth/logout
 */
export const logoutAdmin = async (req, res, next) => {
  try {
    const language = req.language || 'en';

    // In a stateless JWT system, logout is handled client-side
    // by removing the token. This endpoint is just for consistency
    // and can be used for logging/analytics

    return ResponseHandler.success(
      res,
      200,
      getMessage('LOGOUT_SUCCESS', language),
      null
    );

  } catch (error) {
    next(error);
  }
};