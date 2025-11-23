import jwt from 'jsonwebtoken';

/**
 * Generate JWT token
 * @param {String} id - Admin ID
 * @param {String} role - Admin role
 * @returns {String} - JWT token
 */
export const generateToken = (id, role) => {
  return jwt.sign(
    { 
      id, 
      role 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};