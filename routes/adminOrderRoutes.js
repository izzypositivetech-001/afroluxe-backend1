import express from 'express';
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateShippingInfo,
  getOrderStats,
  deleteOrder,
  exportOrders
} from '../controllers/adminOrderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  validateOrderStatus,
  validateShippingInfo
} from '../middleware/orderValidation.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('super_admin', 'admin'));

// Statistics route (before :orderId to avoid route conflict)
router.get('/stats', getOrderStats);

// Export route
router.get('/export', exportOrders);

// Order CRUD
router.get('/', getAllOrders);
router.get('/:orderId', getOrderById);
router.delete('/:orderId', deleteOrder);

// Update order status
router.patch('/:orderId/status', validateOrderStatus, updateOrderStatus);

// Update shipping info
router.patch('/:orderId/shipping', validateShippingInfo, updateShippingInfo);

export default router;