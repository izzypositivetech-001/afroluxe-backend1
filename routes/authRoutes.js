import express from 'express';
import {
  registerAdmin,
  loginAdmin,
  getMe,
  logoutAdmin
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateLogin, validateRegister } from '../middleware/authValidation.js';

const router = express.Router();

router.post('/register', protect, authorize('super_admin'), validateRegister, registerAdmin);
router.post('/login', validateLogin, loginAdmin);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutAdmin);

export default router;