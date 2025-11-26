/**
 * Notification Routes
 * Email notification management endpoints
 */

import express from 'express';
import {
  testEmail,
  resendOrderConfirmation,
  sendShipping,
  checkLowStock,
  getNotificationSettings
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('super_admin', 'admin'));

// Get notification settings
router.get('/settings', getNotificationSettings);

// Test email
router.post('/test-email', testEmail);

// Resend order confirmation
router.post('/resend-confirmation/:orderId', resendOrderConfirmation);

// Send shipping notification
router.post('/shipping/:orderId', sendShipping);

// Check low stock and notify
router.post('/check-low-stock', checkLowStock);

export default router;