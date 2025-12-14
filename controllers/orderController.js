import Order from "../models/order.js";
import Cart from "../models/cart.js";
import Product from "../models/product.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";
import {
  sendOrderConfirmation,
  sendOrderCancellation,
  notifyAdminNewOrder,
  notifyAdminLowStock,
  notifyAdminOrderCancelled,
} from "../utils/emailService.js";

/**
 * Create order from cart (Checkout)
 * POST /api/checkout
 */
export const createOrder = async (req, res, next) => {
  try {
    const { sessionId, customer, shippingAddress, notes } = req.body;
    const language = req.language || "en";

    // Validate session ID
    if (!sessionId) {
      return ResponseHandler.error(res, 400, "Session ID is required");
    }

    console.log(`[CreateOrder] Received sessionId: ${sessionId}`);

    // Get cart
    const cart = await Cart.findOne({ sessionId }).populate("items.product");

    console.log(
      `[CreateOrder] Cart found: ${cart ? "Yes" : "No"}, Items: ${
        cart?.items?.length || 0
      }`
    );

    if (!cart || cart.items.length === 0) {
      return ResponseHandler.error(res, 400, "Cart is empty");
    }

    // Additional validation: Ensure cart has a valid total
    if (!cart.totalAmount || cart.totalAmount <= 0) {
      return ResponseHandler.error(
        res,
        400,
        "Cart total is invalid. Please add items to your cart."
      );
    }

    // Verify stock availability for all items
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);

      if (!product) {
        return ResponseHandler.error(
          res,
          404,
          `Product ${item.product.name.en} not found`
        );
      }

      if (!product.isActive) {
        return ResponseHandler.error(
          res,
          400,
          `Product ${item.product.name.en} is no longer available`
        );
      }

      if (product.stock < item.quantity) {
        return ResponseHandler.error(
          res,
          400,
          `Insufficient stock for ${product.name[language]}. Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }
    }

    // Calculate totals
    const subtotal = cart.totalAmount;
    const taxRate = 0.25; // 25% MVA for Norway
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const shippingFee = 0; // Free shipping for now
    const total = subtotal + tax + shippingFee;

    // Prepare order items with product snapshots
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: {
        en: item.product.name.en,
        no: item.product.name.no,
      },
      quantity: item.quantity,
      price: item.price,
      sku: item.product.sku,
    }));

    // Create order
    const order = await Order.create({
      customer,
      shippingAddress,
      items: orderItems,
      subtotal,
      tax,
      shippingFee,
      total,
      language,
      notes,
      orderStatus: "pending",
      paymentStatus: "pending",
    });

    // Deduct stock for each product
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: {
          stock: -item.quantity,
          salesCount: item.quantity,
        },
      });
    }

    // Clear cart
    await Cart.findOneAndDelete({ sessionId });

    // Populate order for response
    await order.populate("items.product");

    // Send order confirmation email (async, don't wait)
    sendOrderConfirmation(order, language).catch((err) =>
      console.error("Email send failed:", err.message)
    );

    // Notify admin about new order
    notifyAdminNewOrder(order, language).catch((err) =>
      console.error("Admin notification failed:", err.message)
    );

    // Check for low stock and notify admin
    const LOW_STOCK_THRESHOLD = 10;
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (
        product &&
        product.stock <= LOW_STOCK_THRESHOLD &&
        product.stock > 0
      ) {
        notifyAdminLowStock(product, language).catch((err) =>
          console.error("Low stock notification failed:", err.message)
        );
      }
    }

    return ResponseHandler.success(
      res,
      201,
      getMessage("ORDER_CREATED", language),
      order
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by order ID
 * GET /api/orders/:orderId
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const language = req.language || "en";

    const order = await Order.findOne({ orderId }).populate("items.product");

    if (!order) {
      return ResponseHandler.error(res, 404, "Order not found");
    }

    // Transform order based on language
    const transformedOrder = {
      _id: order._id,
      orderId: order.orderId,
      customer: order.customer,
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        _id: item._id,
        product: item.product
          ? {
              _id: item.product._id,
              name: item.name[language],
              images: item.product.images,
              sku: item.sku,
            }
          : {
              name: item.name[language],
              sku: item.sku,
            },
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shippingFee: order.shippingFee,
      total: order.total,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      transformedOrder
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Track order status (Public)
 * GET /api/orders/track/:orderId
 */
export const trackOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const language = req.language || "en";

    const order = await Order.findOne({ orderId })
      .select(
        "orderId orderStatus paymentStatus createdAt updatedAt items subtotal tax shippingFee total Customer shippingAddress"
      )
      .populate("items.product");

    if (!order) {
      return ResponseHandler.error(res, 404, "Order not found");
    }

    const trackingInfo = {
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      itemCount: order.items.length,
      orderDate: order.createdAt,
      lastUpdate: order.updatedAt,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingFee: order.shippingFee,
      total: order.total,
      customer: order.customer,
      shippingAddress: order.shippingAddress,
      statusHistory: [
        {
          status: "pending",
          message: language === "en" ? "Order received" : "Bestilling mottatt",
          completed: true,
        },
        {
          status: "processing",
          message:
            language === "en" ? "Order processing" : "Bestilling behandles",
          completed: ["processing", "shipped", "delivered"].includes(
            order.orderStatus
          ),
        },
        {
          status: "shipped",
          message: language === "en" ? "Order shipped" : "Bestilling sendt",
          completed: ["shipped", "delivered"].includes(order.orderStatus),
        },
        {
          status: "delivered",
          message: language === "en" ? "Order delivered" : "Bestilling levert",
          completed: order.orderStatus === "delivered",
        },
      ],
    };

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      trackingInfo
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Lookup orders by email
 * GET /api/orders/lookup
 */
export const lookupOrdersByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    const language = req.language || "en";

    if (!email) {
      return ResponseHandler.error(res, 400, "Email is required");
    }

    // Find all orders for this email
    const orders = await Order.find({ "customer.email": email })
      .populate("items.product")
      .sort({ createdAt: -1 }); // Most recent first

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
 * Cancel order (User-initiated)
 * POST /api/orders/:orderId/cancel
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { email } = req.body;
    const language = req.language || "en";

    // Validate email is provided
    if (!email) {
      return ResponseHandler.error(
        res,
        400,
        language === "en"
          ? "Email is required to cancel order"
          : "E-post er påkrevd for å kansellere bestilling"
      );
    }

    // Find the order
    const order = await Order.findOne({ orderId });

    if (!order) {
      return ResponseHandler.error(
        res,
        404,
        language === "en" ? "Order not found" : "Bestilling ikke funnet"
      );
    }

    // Security: Verify email matches order
    if (order.customer.email.toLowerCase() !== email.toLowerCase()) {
      return ResponseHandler.error(
        res,
        403,
        language === "en"
          ? "Email does not match order"
          : "E-post samsvarer ikke med bestillingen"
      );
    }

    // Check if order can be cancelled
    if (!["pending", "processing"].includes(order.orderStatus)) {
      return ResponseHandler.error(
        res,
        400,
        language === "en"
          ? `Cannot cancel order with status: ${order.orderStatus}`
          : `Kan ikke kansellere bestilling med status: ${order.orderStatus}`
      );
    }

    // Restore stock for all items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stock: item.quantity,
          salesCount: -item.quantity,
        },
      });
    }

    // Update order status
    order.orderStatus = "cancelled";
    await order.save();

    // Send cancellation emails
    try {
      await sendOrderCancellation(order, language);
      await notifyAdminOrderCancelled(order, language);
    } catch (emailError) {
      console.error("Failed to send cancellation emails:", emailError);
    }

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? "Order cancelled successfully"
        : "Bestilling kansellert",
      { orderId: order.orderId, status: order.orderStatus }
    );
  } catch (error) {
    next(error);
  }
};
