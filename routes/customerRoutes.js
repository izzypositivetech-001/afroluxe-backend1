import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  getCustomerOrders,
  deleteCustomer,
} from "../controllers/customerController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize("admin", "super_admin"));

router.get("/", getAllCustomers);
router.get("/:id", getCustomerById);
router.get("/:customerId/orders", getCustomerOrders);
router.delete("/:id", deleteCustomer);

export default router;
