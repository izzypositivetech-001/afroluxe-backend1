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

const router = express.Router();

router.get('/', getAdminProducts);
router.post('/', validateCreateProduct, createProduct);
router.put('/:id', validateUpdateProduct, updateProduct);
router.delete('/:id', deleteProduct);

export default router;