import express from 'express';
import {
  createOrder,
  getOrderById,
  trackOrder,
  lookupOrdersByEmail,
} from '../controllers/orderController.js';
import { validateCheckout } from '../middleware/orderValidation.js';

const router = express.Router();

router.post('/', validateCheckout, createOrder);
router.get('/:orderId', getOrderById);
router.get('/track/:orderId', trackOrder);
router.get('/lookup', lookupOrdersByEmail);

export default router;