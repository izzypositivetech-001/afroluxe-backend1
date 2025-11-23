import { body, validationResult } from 'express-validator';
import ResponseHandler from '../utils/responseHandler.js';

// Validation for create payment intent
export const validateCreateIntent = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .trim(),

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

// Validation for confirm payment
export const validateConfirmPayment = [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment Intent ID is required')
    .trim(),
  
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
    .trim(),
  
  body('shippingAddress.street')
    .notEmpty()
    .withMessage('Street address is required')
    .trim(),
  
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required')
    .trim(),
  
  body('shippingAddress.postalCode')
    .notEmpty()
    .withMessage('Postal code is required')
    .trim()
    .matches(/^[0-9]{4}$/)
    .withMessage('Please enter a valid Norwegian postal code (4 digits)'),

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

// Validation for refund
export const validateRefund = [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment Intent ID is required')
    .trim(),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('reason')
    .optional()
    .isIn(['duplicate', 'fraudulent', 'requested_by_customer'])
    .withMessage('Invalid refund reason'),

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