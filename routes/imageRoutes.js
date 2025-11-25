import express from 'express';
import {
  uploadProductImages,
  deleteProductImage,
  reorderProductImages,
  setPrimaryImage,
  deleteAllProductImages,
  getUploadSignature
} from '../controllers/imageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('super_admin', 'admin'));

// Get upload signature
router.get('/signature', getUploadSignature);

// Upload product images (multiple files)
router.post('/products/:productId', upload.array('images', 10), uploadProductImages);

// Delete all product images
router.delete('/products/:productId', deleteAllProductImages);

// Delete single image
router.delete('/products/:productId/:imageIndex', deleteProductImage);

// Reorder images
router.patch('/products/:productId/reorder', reorderProductImages);

// Set primary image
router.patch('/products/:productId/:imageIndex/primary', setPrimaryImage);

export default router;