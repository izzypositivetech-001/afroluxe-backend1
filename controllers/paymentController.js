/**
 * Payment Controller
 * Handles Stripe payment processing
 */

import stripe from '../config/stripe.js';
import Order from '../models/order.js';
import Cart from '../models/cart.js';
import ResponseHandler from '../utils/responseHandler.js';
import { getMessage } from '../utils/translations.js';

/**
 * Create payment intent
 * POST /api/payments/create-intent
 */
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const language = req.language || 'en';

    if (!sessionId) {
      return ResponseHandler.error(res, 400, 'Session ID is required');
    }

    // Get cart
    const cart = await Cart.findOne({ sessionId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return ResponseHandler.error(res, 400, 'Cart is empty');
    }

    // Calculate amounts
    const subtotal = cart.totalAmount;
    const taxRate = 0.25; // 25% MVA
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const shippingFee = 0;
    const total = subtotal + tax + shippingFee;

    // Convert to øre (smallest currency unit for NOK)
    const amountInOre = Math.round(total * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInOre,
      currency: 'nok',
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        sessionId,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        shippingFee: shippingFee.toString(),
        total: total.toString()
      }
    });

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: total,
        currency: 'NOK'
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Confirm payment and create order
 * POST /api/payments/confirm
 */
export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, sessionId, customer, shippingAddress, notes } = req.body;
    const language = req.language || 'en';

    if (!paymentIntentId || !sessionId) {
      return ResponseHandler.error(
        res,
        400,
        'Payment Intent ID and Session ID are required'
      );
    }

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return ResponseHandler.error(
        res,
        400,
        language === 'en' 
          ? 'Payment not completed' 
          : 'Betaling ikke fullført'
      );
    }

    // Get cart
    const cart = await Cart.findOne({ sessionId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return ResponseHandler.error(res, 400, 'Cart is empty');
    }

    // Verify amounts match
    const metadata = paymentIntent.metadata;
    const cartTotal = parseFloat(metadata.total);
    const expectedAmount = Math.round(cartTotal * 100);

    if (paymentIntent.amount !== expectedAmount) {
      return ResponseHandler.error(
        res,
        400,
        'Payment amount mismatch'
      );
    }

    // Create order (same logic as checkout)
    const Product = (await import('../models/product.js')).default;

    // Verify stock
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      
      if (!product || !product.isActive) {
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
          `Insufficient stock for ${product.name[language]}`
        );
      }
    }

    // Prepare order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: {
        en: item.product.name.en,
        no: item.product.name.no
      },
      quantity: item.quantity,
      price: item.price,
      sku: item.product.sku
    }));

    // Create order
    const order = await Order.create({
      customer,
      shippingAddress,
      items: orderItems,
      subtotal: parseFloat(metadata.subtotal),
      tax: parseFloat(metadata.tax),
      shippingFee: parseFloat(metadata.shippingFee),
      total: cartTotal,
      language,
      notes,
      orderStatus: 'processing',
      paymentStatus: 'paid',
      paymentMethod: 'stripe',
      paymentIntentId: paymentIntent.id
    });

    // Deduct stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        {
          $inc: {
            stock: -item.quantity,
            salesCount: item.quantity
          }
        }
      );
    }

    // Clear cart
    await Cart.findOneAndDelete({ sessionId });

    // Populate order
    await order.populate('items.product');

    // Send confirmation email (async)
    const { sendOrderConfirmation } = await import('../utils/emailService.js');
    sendOrderConfirmation(order, language).catch(err => 
      console.error('Email send failed:', err.message)
    );

    return ResponseHandler.success(
      res,
      201,
      getMessage('ORDER_CREATED', language),
      order
    );

  } catch (error) {
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
    const language = req.language || 'en';

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        created: new Date(paymentIntent.created * 1000)
      }
    );

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
    const language = req.language || 'en';

    if (!paymentIntentId) {
      return ResponseHandler.error(
        res,
        400,
        'Payment Intent ID is required'
      );
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
      reason: reason || 'requested_by_customer'
    });

    // Update order payment status
    await Order.findOneAndUpdate(
      { paymentIntentId },
      { 
        paymentStatus: refund.amount === refund.payment_intent ? 'refunded' : 'paid',
        $push: {
          refunds: {
            refundId: refund.id,
            amount: refund.amount / 100,
            reason: refund.reason,
            createdAt: new Date(refund.created * 1000)
          }
        }
      }
    );

    return ResponseHandler.success(
      res,
      200,
      language === 'en' ? 'Refund processed successfully' : 'Refusjon behandlet vellykket',
      {
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        status: refund.status
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
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update order status
      await Order.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { paymentStatus: 'paid' }
      );
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      await Order.findOneAndUpdate(
        { paymentIntentId: failedPayment.id },
        { paymentStatus: 'failed' }
      );
      break;

    case 'charge.refunded':
      const refund = event.data.object;
      console.log('Refund processed:', refund.id);
      
      await Order.findOneAndUpdate(
        { paymentIntentId: refund.payment_intent },
        { paymentStatus: 'refunded' }
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};