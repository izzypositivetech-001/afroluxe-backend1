import Order from "../models/order.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";

/**
 * Get all customers (Admin)
 * GET /api/customers
 */
export const getAllCustomers = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // Aggregate customer data from orders
    const customers = await Order.aggregate([
      {
        $group: {
          _id: "$customer.email",
          name: { $first: "$customer.name" },
          email: { $first: "$customer.email" },
          phone: { $first: "$customer.phone" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          firstOrderDate: { $min: "$createdAt" },
          lastOrderDate: { $max: "$createdAt" },
          addresses: { $push: "$shippingAddress" },
        },
      },
      {
        $project: {
          _id: "$_id", // Keep _id as email for consistency
          customerId: "$_id",
          name: 1,
          email: 1,
          phone: 1,
          totalOrders: 1,
          totalSpent: 1,
          firstOrderDate: 1,
          lastOrderDate: 1,
          addresses: 1,
        },
      },
      { $sort: { totalSpent: -1 } },
    ]);

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      customers
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer by ID (Admin)
 * GET /api/customers/:id (email)
 */
export const getCustomerById = async (req, res, next) => {
  try {
    const language = req.language || "en";
    const { id } = req.params; // id is the customer email

    // Get customer orders
    const orders = await Order.find({ "customer.email": id }).sort({
      createdAt: -1,
    });

    if (orders.length === 0) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Customer not found" : "Kunde ikke funnet"
      );
    }

    // Calculate customer stats
    const customer = {
      email: id,
      name: orders[0].customer.name,
      phone: orders[0].customer.phone,
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      firstOrderDate: orders[orders.length - 1].createdAt,
      lastOrderDate: orders[0].createdAt,
      orders: orders,
      addresses: [
        ...new Set(orders.map((o) => JSON.stringify(o.shippingAddress))),
      ].map((a) => JSON.parse(a)),
    };

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      customer
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer orders (Admin)
 * GET /api/customers/:customerId/orders
 */
export const getCustomerOrders = async (req, res, next) => {
  try {
    const language = req.language || "en";
    const { customerId } = req.params; // customerId is the email

    const orders = await Order.find({ "customer.email": customerId })
      .sort({ createdAt: -1 })
      .populate("items.product");

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      orders
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete customer (Admin)
 * DELETE /api/customers/:id
 */
export const deleteCustomer = async (req, res, next) => {
  try {
    const language = req.language || "en";
    const { id } = req.params; // id is the email

    // Delete all customer orders
    const result = await Order.deleteMany({ "customer.email": id });

    if (result.deletedCount === 0) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Customer not found" : "Kunde ikke funnet"
      );
    }

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? `Customer and ${result.deletedCount} orders deleted successfully`
        : `Kunde og ${result.deletedCount} bestillinger slettet`
    );
  } catch (error) {
    next(error);
  }
};
