/**
 * Security Management Routes
 * Admin endpoints for security configuration
 */

import express from 'express';
import {
  getSecurityStatus,
  blockIPAddress,
  unblockIPAddress,
  getBlockedIPsList,
  clearBlockedIPs
} from '../controllers/securityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require super_admin authentication
router.use(protect);
router.use(authorize('super_admin'));

// Get security status
router.get('/status', getSecurityStatus);

// Block IP address
router.post('/block-ip', blockIPAddress);

// Unblock IP address
router.post('/unblock-ip', unblockIPAddress);

// Get blocked IPs list
router.get('/blocked-ips', getBlockedIPsList);

// Clear all blocked IPs
router.post('/clear-blocked-ips', clearBlockedIPs);

export default router;