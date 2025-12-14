/**
 * Admin Order Controller
 * Manage orders - view, update status, statistics
 */

import Order from "../models/order.js";
import Product from "../models/product.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";
import {
  sendOrderStatusUpdate,
  sendShippingNotification,
  sendPaymentConfirmation,
  sendOrderCancellation,
  notifyAdminOrderCancelled,
} from "../utils/emailService.js";

/**
 * Get all orders with filters and pagination
 * GET /api/admin/orders
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filters
    const filters = {};

    if (req.query.orderStatus) {
      filters.orderStatus = req.query.orderStatus;
    }

    if (req.query.paymentStatus) {
      filters.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.paymentMethod) {
      filters.paymentMethod = req.query.paymentMethod;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filters.createdAt = {};
      if (req.query.startDate) {
        filters.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filters.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Search by order ID or customer email
    if (req.query.search) {
      filters.$or = [
        { orderId: { $regex: req.query.search, $options: "i" } },
        { "customer.email": { $regex: req.query.search, $options: "i" } },
        { "customer.name": { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Sort
    let sort = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
      sort[sortField] = sortOrder;
    } else {
      sort = { createdAt: -1 }; // Default: newest first
    }

    // Get orders
    const orders = await Order.find(filters)
      .populate("items.product", "name sku")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalOrders = await Order.countDocuments(filters);
    const totalPages = Math.ceil(totalOrders / limit);

    return ResponseHandler.success(res, 200, getMessage("SUCCESS", language), {
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        ordersPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single order by ID
 * GET /api/admin/orders/:orderId
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const language = req.language || "en";

    const order = await Order.findOne({ orderId }).populate(
      "items.product",
      "name sku images price"
    );

    if (!order) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Order not found" : "Bestilling ikke funnet"
      );
    }

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      order
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * PATCH /api/admin/orders/:orderId/status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;
    const language = req.language || "en";

    if (!orderStatus) {
      return ResponseHandler.error(res, 400, "Order status is required");
    }

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(orderStatus)) {
      return ResponseHandler.error(res, 400, "Invalid order status");
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Order not found" : "Bestilling ikke funnet"
      );
    }

    // If cancelling order, restore stock
    if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            stock: item.quantity,
            salesCount: -item.quantity,
          },
        });
      }
    }

    order.orderStatus = orderStatus;
    await order.save();

    await order.populate("items.product", "name sku");

    // Send email notifications based on status change
    try {
      if (orderStatus === "cancelled") {
        await sendOrderCancellation(order, language);
        // Notify admin about cancellation
        await notifyAdminOrderCancelled(order, language);
      } else {
        await sendOrderStatusUpdate(order, orderStatus, language);
      }
    } catch (emailError) {
      console.error("Failed to send order status email:", emailError);
    }

    return ResponseHandler.success(
      res,
      200,
      getMessage("UPDATED", language),
      order
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update payment status
 * PATCH /api/admin/orders/:orderId/payment-status
 */
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;
    const language = req.language || "en";

    const order = await Order.findOne({ orderId });

    if (!order) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Order not found" : "Bestilling ikke funnet"
      );
    }

    order.paymentStatus = paymentStatus;

    // If paid, update payment info
    if (paymentStatus === "paid" && !order.paymentInfo?.paidAt) {
      if (!order.paymentInfo) order.paymentInfo = {};
      order.paymentInfo.paidAt = new Date();
      order.paymentInfo.status = "succeeded";
    }

    await order.save();

    // Send payment confirmation email when marked as paid
    try {
      if (paymentStatus === "paid") {
        await sendPaymentConfirmation(order, language);
      }
    } catch (emailError) {
      console.error("Failed to send payment confirmation email:", emailError);
    }

    return ResponseHandler.success(
      res,
      200,
      getMessage("UPDATED", language),
      order
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipping info
 * PATCH /api/admin/orders/:orderId/shipping
 */
export const updateShippingInfo = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier, estimatedDelivery } = req.body;
    const language = req.language || "en";

    const order = await Order.findOne({ orderId });

    if (!order) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Order not found" : "Bestilling ikke funnet"
      );
    }

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (carrier) order.carrier = carrier;
    if (estimatedDelivery)
      order.estimatedDelivery = new Date(estimatedDelivery);

    // Auto-update order status to shipped if tracking added
    if (trackingNumber && order.orderStatus === "processing") {
      order.orderStatus = "shipped";
    }

    await order.save();
    await order.populate("items.product", "name sku");

    // Send shipping notification if tracking was added
    try {
      if (trackingNumber) {
        await sendShippingNotification(order, language);
      }
    } catch (emailError) {
      console.error("Failed to send shipping notification email:", emailError);
    }

    return ResponseHandler.success(
      res,
      200,
      getMessage("UPDATED", language),
      order
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 * GET /api/admin/orders/stats
 */
export const getOrderStats = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // Total orders
    const totalOrders = await Order.countDocuments();

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Orders by payment status
    const ordersByPaymentStatus = await Order.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Total revenue
    const revenueData = await Order.aggregate([
      {
        $match: { paymentStatus: "paid" },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          averageOrderValue: { $avg: "$total" },
        },
      },
    ]);

    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrdersCount = await Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const recentRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    // Orders by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const ordersByMonth = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      {
        $match: { orderStatus: { $ne: "cancelled" } },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.product",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.price"] },
          },
        },
      },
      {
        $sort: { totalQuantity: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $project: {
          productId: "$_id",
          name: "$product.name",
          sku: "$product.sku",
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    const stats = {
      overview: {
        totalOrders,
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        averageOrderValue:
          Math.round((revenueData[0]?.averageOrderValue || 0) * 100) / 100,
        recentOrders: recentOrdersCount,
        recentRevenue: recentRevenue[0]?.total || 0,
      },
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      ordersByPaymentStatus: ordersByPaymentStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      ordersByMonth,
      topProducts,
    };

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      stats
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete order (soft delete - cancelled status)
 * DELETE /api/admin/orders/:orderId
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const language = req.language || "en";

    const order = await Order.findOne({ orderId });

    if (!order) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Order not found" : "Bestilling ikke funnet"
      );
    }

    // Restore stock if not already cancelled
    if (order.orderStatus !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            stock: item.quantity,
            salesCount: -item.quantity,
          },
        });
      }
    }

    // Soft delete - set status to cancelled
    order.orderStatus = "cancelled";
    await order.save();

    // Notify about cancellation
    try {
      await sendOrderCancellation(order, language);
      await notifyAdminOrderCancelled(order, language);
    } catch (emailError) {
      console.error("Failed to send cancellation emails:", emailError);
    }

    return ResponseHandler.success(res, 200, getMessage("DELETED", language), {
      orderId: order.orderId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export orders to CSV
 * GET /api/admin/orders/export
 */
export const exportOrders = async (req, res, next) => {
  try {
    const language = req.language || "en";

    // Get filters from query (same as getAllOrders)
    const filters = {};

    if (req.query.orderStatus) {
      filters.orderStatus = req.query.orderStatus;
    }

    if (req.query.paymentStatus) {
      filters.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.startDate || req.query.endDate) {
      filters.createdAt = {};
      if (req.query.startDate) {
        filters.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filters.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const orders = await Order.find(filters)
      .populate("items.product", "name sku")
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvHeaders = [
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Phone",
      "Total",
      "Order Status",
      "Payment Status",
      "Payment Method",
      "Created At",
      "Items",
    ].join(",");

    const csvRows = orders.map((order) => {
      const items = order.items
        .map((item) => `${item.name[language]} (x${item.quantity})`)
        .join("; ");

      return [
        order.orderId,
        order.customer.name,
        order.customer.email,
        order.customer.phone,
        order.total,
        order.orderStatus,
        order.paymentStatus,
        order.paymentMethod,
        order.createdAt.toISOString(),
        `"${items}"`,
      ].join(",");
    });

    const csv = [csvHeaders, ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=orders-${Date.now()}.csv`
    );

    return res.send(csv);
  } catch (error) {
    next(error);
  }
};
