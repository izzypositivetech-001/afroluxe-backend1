import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  validateLogin,
  validateRegister,
} from "../middleware/authValidation.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, validateRegister, registerAdmin);
router.post("/login", authLimiter, validateLogin, loginAdmin);
router.get("/me", protect, getAdminProfile);
router.post("/logout", protect, logoutAdmin);

export default router;
