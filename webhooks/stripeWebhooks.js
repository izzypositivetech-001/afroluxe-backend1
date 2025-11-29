import Stripe from "stripe";
import Order from "../models/order.js";
import ResponseHandler from "../utils/responseHandler.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @desc    Handle Stripe webhook events
 * @route   POST /api/payment/webhook
 * @access  Public (verified by Stripe signature)
 */
export const handleStripeWebhook = async (req, res) => {
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
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).send("Webhook handler failed");
  }
};

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);

  // Find order by payment intent ID
  const order = await Order.findOne({ paymentIntentId: paymentIntent.id });

  if (order) {
    order.paymentStatus = "paid";
    order.orderStatus = "processing";
    order.paidAt = new Date();
    await order.save();

    console.log(`Order ${order.orderId} marked as paid`);
  } else {
    console.warn(`No order found for payment intent: ${paymentIntent.id}`);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);

  const order = await Order.findOne({ paymentIntentId: paymentIntent.id });

  if (order) {
    order.paymentStatus = "failed";
    order.orderStatus = "cancelled";
    await order.save();

    console.log(`Order ${order.orderId} marked as failed`);
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent) {
  console.log(`Payment canceled: ${paymentIntent.id}`);

  const order = await Order.findOne({ paymentIntentId: paymentIntent.id });

  if (order) {
    order.paymentStatus = "cancelled";
    order.orderStatus = "cancelled";
    await order.save();

    console.log(`Order ${order.orderId} marked as cancelled`);
  }
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge) {
  console.log(`Charge refunded: ${charge.id}`);

  const paymentIntentId = charge.payment_intent;
  const order = await Order.findOne({ paymentIntentId });

  if (order) {
    order.paymentStatus = "refunded";
    order.orderStatus = "refunded";
    await order.save();

    console.log(`Order ${order.orderId} marked as refunded`);
  }
}
