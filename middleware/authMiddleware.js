import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import ResponseHandler from '../utils/responseHandler.js';

/**
 * Protect routes - verify JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return ResponseHandler.error(
      res,
      401,
      'Not authorized to access this route'
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get admin from token
    req.admin = await Admin.findById(decoded.id).select('-password');

    if (!req.admin) {
      return ResponseHandler.error(
        res,
        401,
        'Admin not found'
      );
    }

    // Check if admin is active
    if (!req.admin.isActive) {
      return ResponseHandler.error(
        res,
        401,
        'Account is deactivated'
      );
    }

    next();

  } catch (error) {
    return ResponseHandler.error(
      res,
      401,
      'Not authorized to access this route'
    );
  }
};