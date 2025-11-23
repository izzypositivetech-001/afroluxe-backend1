import ResponseHandler from '../utils/responseHandler.js';

/**
 * Check if admin has required role
 * @param  {...String} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return ResponseHandler.error(
        res,
        401,
        'Not authorized to access this route'
      );
    }

    if (!roles.includes(req.admin.role)) {
      return ResponseHandler.error(
        res,
        403,
        'You do not have permission to perform this action'
      );
    }

    next();
  };
};