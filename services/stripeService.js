import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent
 * @param {number} amount - Amount in NOK (will be converted to øre)
 * @param {string} currency - Currency code (default: 'nok')
 * @param {object} metadata - Additional metadata
 * @returns {Promise<Stripe.PaymentIntent>}
 */
export const createPaymentIntent = async (
  amount,
  currency = "nok",
  metadata = {}
) => {
  try {
    // Convert amount to øre (smallest currency unit for NOK)
    const amountInOre = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInOre,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });

    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
};

/**
 * Retrieve a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Stripe.PaymentIntent>}
 */
export const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    throw error;
  }
};

/**
 * Cancel a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Stripe.PaymentIntent>}
 */
export const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error("Error canceling payment intent:", error);
    throw error;
  }
};

/**
 * Create a refund
 * @param {string} paymentIntentId - Payment intent ID
 * @param {number} amount - Amount to refund (optional, full refund if not specified)
 * @returns {Promise<Stripe.Refund>}
 */
export const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const refundData = { payment_intent: paymentIntentId };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to øre
    }

    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error("Error creating refund:", error);
    throw error;
  }
};

/**
 * List all payment methods for a customer
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Stripe.PaymentMethod[]>}
 */
export const listPaymentMethods = async (customerId) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    return paymentMethods.data;
  } catch (error) {
    console.error("Error listing payment methods:", error);
    throw error;
  }
};

/**
 * Verify webhook signature
 * @param {string|Buffer} payload - Request body
 * @param {string} signature - Stripe signature header
 * @param {string} secret - Webhook secret
 * @returns {Stripe.Event}
 */
export const constructWebhookEvent = (payload, signature, secret) => {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return event;
  } catch (error) {
    console.error("Error constructing webhook event:", error);
    throw error;
  }
};

export default stripe;
