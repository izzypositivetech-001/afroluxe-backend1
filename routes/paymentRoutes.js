import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  refundPayment,
  handleWebhook
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  validateCreateIntent,
  validateConfirmPayment,
  validateRefund
} from '../middleware/paymentValidation.js';

const router = express.Router();

// Public routes
router.post('/create-intent', validateCreateIntent, createPaymentIntent);
router.post('/confirm', validateConfirmPayment, confirmPayment);
router.get('/status/:paymentIntentId', getPaymentStatus);

// Webhook route (no auth - verified by Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Admin routes
router.post('/refund', protect, authorize('super_admin', 'admin'), validateRefund, refundPayment);

export default router;