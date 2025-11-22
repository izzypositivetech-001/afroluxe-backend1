
import { body, validationResult } from 'express-validator';
import ResponseHandler from '../utils/responseHandler.js';

// Validation for adding to cart
export const validateAddToCart = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('sessionId')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Session ID cannot be empty'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseHandler.error(
        res,
        400,
        'Validation failed',
        errors.array()
      );
    }
    next();
  }
];

// Validation for updating cart
export const validateUpdateCart = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .trim(),
  
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be 0 or greater'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseHandler.error(
        res,
        400,
        'Validation failed',
        errors.array()
      );
    }
    next();
  }
];