import { body, validationResult } from "express-validator";
import ResponseHandler from "../utils/responseHandler.js";

// Validation for create payment intent
export const validateCreateIntent = [
  body("orderId").notEmpty().withMessage("Order ID is required").trim(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseHandler.error(
        res,
        400,
        "Validation failed",
        errors.array()
      );
    }
    next();
  },
];

// Validation for confirm payment
export const validateConfirmPayment = [
  body("paymentIntentId")
    .notEmpty()
    .withMessage("Payment Intent ID is required")
    .trim(),

  body("orderId").notEmpty().withMessage("Order ID is required").trim(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseHandler.error(
        res,
        400,
        "Validation failed",
        errors.array()
      );
    }
    next();
  },
];

// Validation for refund
export const validateRefund = [
  body("paymentIntentId")
    .notEmpty()
    .withMessage("Payment Intent ID is required")
    .trim(),

  body("amount")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),

  body("reason")
    .optional()
    .isIn(["duplicate", "fraudulent", "requested_by_customer"])
    .withMessage("Invalid refund reason"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ResponseHandler.error(
        res,
        400,
        "Validation failed",
        errors.array()
      );
    }
    next();
  },
];
