import express from 'express';
import {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  deactivateAdmin,
  activateAdmin
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require super_admin role
router.use(protect);
router.use(authorize('super_admin'));

router.get('/', getAllAdmins);
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);
router.patch('/:id/deactivate', deactivateAdmin);
router.patch('/:id/activate', activateAdmin);

export default router;