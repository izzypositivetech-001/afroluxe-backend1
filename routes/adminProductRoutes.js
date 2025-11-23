import express from 'express';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

import {
  validateCreateProduct,
  validateUpdateProduct
} from '../middleware/productValidation.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

//All admin products routes require authentication and authorization
router.use(protect);
router.use(authorize('admin', 'super_admin'));

router.get('/', getAdminProducts);
router.post('/', validateCreateProduct, createProduct);
router.put('/:id', validateUpdateProduct, updateProduct);
router.delete('/:id', deleteProduct);

export default router;