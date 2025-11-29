/**
 * Payment Controller
 * Handles Stripe payment processing
 */

import stripe from "../config/stripe.js";
import Order from "../models/order.js";
import Cart from "../models/cart.js";
import ResponseHandler from "../utils/responseHandler.js";
import { getMessage } from "../utils/translations.js";
import {
  createPaymentIntent,
  retrievePaymentIntent,
} from "../services/stripeService.js";

/**
 * Create payment intent
 * POST /api/payments/create-intent
 */
export const createIntent = async (req, res, next) => {
  try {
    const { orderId, amount } = req.body;
    const language = req.language || "en";

    if (!orderId) {
      return ResponseHandler.error(res, 400, "Order ID is required");
    }

    // Get order
    // Check if orderId is a valid ObjectId before querying _id to avoid CastError
    const query = orderId.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ orderId }, { _id: orderId }] }
      : { orderId };

    const order = await Order.findOne(query);

    if (!order) {
      return ResponseHandler.error(res, 404, "Order not found");
    }

    // Check if order already paid
    if (order.paymentStatus === "paid") {
      return ResponseHandler.error(res, 400, "Order already paid");
    }

    // Use order total or provided amount
    const totalAmount = amount || order.total;

    // Create payment intent with Stripe
    const paymentIntent = await createPaymentIntent(totalAmount, "nok", {
      orderId: order.orderId,
      orderDbId: order._id.toString(),
    });

    // Update order with payment intent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    return ResponseHandler.success(res, 200, getMessage("SUCCESS", language), {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      currency: "nok",
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    next(error);
  }
};

/**
 * @desc    Confirm payment and update order
 * @route   POST /api/payment/confirm
 * @access  Public
 */
export const confirmPayment = async (req, res, next) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    const language = req.language || "en";

    if (!orderId || !paymentIntentId) {
      return ResponseHandler.error(
        res,
        400,
        "Order ID and Payment Intent ID are required"
      );
    }

    // Get order
    // Check if orderId is a valid ObjectId before querying _id to avoid CastError
    const query = orderId.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ orderId }, { _id: orderId }] }
      : { orderId };

    const order = await Order.findOne(query);

    if (!order) {
      return ResponseHandler.error(res, 404, "Order not found");
    }

    // Verify payment with Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return ResponseHandler.error(
        res,
        400,
        `Payment not completed. Status: ${paymentIntent.status}`
      );
    }

    // Verify amount matches
    const paidAmount = paymentIntent.amount / 100;
    if (Math.abs(paidAmount - order.total) > 0.01) {
      return ResponseHandler.error(
        res,
        400,
        `Payment amount mismatch. Expected: ${order.total}, Paid: ${paidAmount}`
      );
    }

    // Update order status
    order.paymentStatus = "paid";
    order.orderStatus = "processing";
    order.paymentIntentId = paymentIntentId;
    order.paidAt = new Date();
    await order.save();

    return ResponseHandler.success(res, 200, "Payment confirmed successfully", {
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paidAt: order.paidAt,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    next(error);
  }
};

/**
 * @desc    Verify payment status
 * @route   GET /api/payment/verify/:paymentIntentId
 * @access  Public
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;
    const language = req.language || "en";

    if (!paymentIntentId) {
      return ResponseHandler.error(res, 400, "Payment Intent ID is required");
    }

    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    const isSuccessful = paymentIntent.status === "succeeded";
    const isPending = paymentIntent.status === "processing";
    const isFailed = ["requires_payment_method", "canceled", "failed"].includes(
      paymentIntent.status
    );

    return ResponseHandler.success(res, 200, getMessage("SUCCESS", language), {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      isSuccessful,
      isPending,
      isFailed,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    next(error);
  }
};

/**
 * @desc    Get payment methods
 * @route   GET /api/payment/methods
 * @access  Public
 */
export const getPaymentMethods = async (req, res, next) => {
  try {
    const language = req.language || "en";

    const paymentMethods = [
      {
        id: "card",
        name: language === "no" ? "Kort" : "Card",
        description:
          language === "no"
            ? "Betal med kreditt- eller debetkort"
            : "Pay with credit or debit card",
        icon: "credit-card",
        enabled: true,
        types: ["visa", "mastercard", "amex"],
      },
    ];

    return ResponseHandler.success(
      res,
      200,
      getMessage("SUCCESS", language),
      paymentMethods
    );
  } catch (error) {
    console.error("Error getting payment methods:", error);
    next(error);
  }
};

/**
 * Get payment status
 * GET /api/payments/status/:paymentIntentId
 */
export const getPaymentStatus = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;
    const language = req.language || "en";

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return ResponseHandler.success(res, 200, getMessage("SUCCESS", language), {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      created: new Date(paymentIntent.created * 1000),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refund payment
 * POST /api/payments/refund
 */
export const refundPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;
    const language = req.language || "en";

    if (!paymentIntentId) {
      return ResponseHandler.error(res, 400, "Payment Intent ID is required");
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
      reason: reason || "requested_by_customer",
    });

    // Update order payment status
    await Order.findOneAndUpdate(
      { paymentIntentId },
      {
        paymentStatus:
          refund.amount === refund.payment_intent ? "refunded" : "paid",
        $push: {
          refunds: {
            refundId: refund.id,
            amount: refund.amount / 100,
            reason: refund.reason,
            createdAt: new Date(refund.created * 1000),
          },
        },
      }
    );

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? "Refund processed successfully"
        : "Refusjon behandlet vellykket",
      {
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        status: refund.status,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Webhook handler for Stripe events
 * POST /api/payments/webhook
 */
export const handleWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("Payment succeeded:", paymentIntent.id);

      // Update order status
      await Order.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { paymentStatus: "paid" }
      );
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log("Payment failed:", failedPayment.id);

      await Order.findOneAndUpdate(
        { paymentIntentId: failedPayment.id },
        { paymentStatus: "failed" }
      );
      break;

    case "charge.refunded":
      const refund = event.data.object;
      console.log("Refund processed:", refund.id);

      await Order.findOneAndUpdate(
        { paymentIntentId: refund.payment_intent },
        { paymentStatus: "refunded" }
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
