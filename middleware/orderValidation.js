/**
 * Order Validation Middleware
 * Validates checkout data
 */

import { body, validationResult } from 'express-validator';
import ResponseHandler from '../utils/responseHandler.js';

// Validation for checkout
export const validateCheckout = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .trim(),
  
  body('customer.name')
    .notEmpty()
    .withMessage('Customer name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('customer.email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('customer.phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage('Please enter a valid phone number'),
  
  body('shippingAddress.street')
    .notEmpty()
    .withMessage('Street address is required')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('shippingAddress.postalCode')
    .notEmpty()
    .withMessage('Postal code is required')
    .trim()
    .matches(/^[0-9]{4}$/)
    .withMessage('Please enter a valid Norwegian postal code (4 digits)'),
  
  body('shippingAddress.country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),

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

// Validation for update order status
export const validateOrderStatus = [
  body('orderStatus')
    .notEmpty()
    .withMessage('Order status is required')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),

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

// Validation for update shipping info
export const validateShippingInfo = [
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Tracking number must be between 3 and 100 characters'),
  
  body('carrier')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Carrier name must be between 2 and 50 characters'),
  
  body('estimatedDelivery')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for estimated delivery'),

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