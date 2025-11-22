import express from 'express';
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cartController.js';
import {
  validateAddToCart,
  validateUpdateCart
} from '../middleware/cartValidation.js';

const router = express.Router();

router.post('/add', validateAddToCart, addToCart);
router.get('/:sessionId', getCart);
router.put('/update', validateUpdateCart, updateCartItem);
router.delete('/remove/:sessionId/:itemId', removeCartItem);
router.delete('/clear/:sessionId', clearCart);

export default router;