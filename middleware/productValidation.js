import { body, validationResult } from 'express-validator';
import ResponseHandler from '../utils/responseHandler.js';

// Validation rules for creating a product
export const validateCreateProduct = [
  body('name.en')
    .trim()
    .notEmpty()
    .withMessage('English name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('English name must be between 3 and 200 characters'),
  
  body('name.no')
    .trim()
    .notEmpty()
    .withMessage('Norwegian name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Norwegian name must be between 3 and 200 characters'),
  
  body('description.en')
    .trim()
    .notEmpty()
    .withMessage('English description is required')
    .isLength({ min: 10 })
    .withMessage('English description must be at least 10 characters'),
  
  body('description.no')
    .trim()
    .notEmpty()
    .withMessage('Norwegian description is required')
    .isLength({ min: 10 })
    .withMessage('Norwegian description must be at least 10 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a positive integer'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('SKU must not exceed 50 characters'),

  // Validation result handler
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

// Validation rules for updating a product
export const validateUpdateProduct = [
  body('name.en')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('English name must be between 3 and 200 characters'),
  
  body('name.no')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Norwegian name must be between 3 and 200 characters'),
  
  body('description.en')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('English description must be at least 10 characters'),
  
  body('description.no')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Norwegian description must be at least 10 characters'),
  
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a positive integer'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  // Validation result handler
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