import Cart from '../models/cart.js';
import Order from '../models/order.js';
import Product from '../models/product.js';
import { retrievePaymentIntent } from '../services/stripeService.js';
import ResponseHandler from '../utils/responseHandler.js';
import { getMessage } from '../utils/translations.js';

/**
 * @desc    Process checkout and create order
 * @route   POST /api/checkout
 * @access  Public
 */
export const processCheckout = async (req, res, next) => {
  try {
    const {
      sessionId,
      paymentIntentId, // ✅ OPTIONAL - if provided, verify payment
      customer,
      shippingAddress,
      couponCode,
    } = req.body;

    const language = req.language || 'en';

    // Validate required fields
    if (!sessionId || !customer || !shippingAddress) {
      return ResponseHandler.error(res, 400, 'Missing required fields');
    }

    // ✅ If paymentIntentId provided, verify payment completed
    if (paymentIntentId) {
      const paymentIntent = await retrievePaymentIntent(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return ResponseHandler.error(
          res,
          400,
          `Payment not completed. Status: ${paymentIntent.status}`
        );
      }
    }

    // Get cart
    const cart = await Cart.findOne({ sessionId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return ResponseHandler.error(res, 400, 'Cart is empty');
    }

    // Verify stock availability
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      
      if (!product) {
        return ResponseHandler.error(res, 404, `Product ${item.product.name.en} not found`);
      }

      if (product.stock < item.quantity) {
        return ResponseHandler.error(
          res,
          400,
          `Insufficient stock for ${product.name.en}. Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.25;
    const shippingFee = 0;
    const discount = 0;
    const total = subtotal + tax + shippingFee - discount;

    // ✅ If payment provided, verify amount matches
    if (paymentIntentId) {
      const paymentIntent = await retrievePaymentIntent(paymentIntentId);
      const paidAmount = paymentIntent.amount / 100;
      
      if (Math.abs(paidAmount - total) > 0.01) {
        return ResponseHandler.error(
          res,
          400,
          `Payment amount mismatch. Expected: ${total}, Paid: ${paidAmount}`
        );
      }
    }

    // Generate order ID
    const orderCount = await Order.countDocuments();
    const orderId = `ALX-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, '0')}`;

    // Prepare order items
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.price,
      quantity: item.quantity,
      sku: item.product.sku,
    }));

    // Create order
    const order = await Order.create({
      orderId,
      sessionId,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      shippingAddress: {
        street: shippingAddress.street,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
      items: orderItems,
      subtotal,
      tax,
      shippingFee,
      discount,
      total,
      paymentMethod: paymentIntentId ? 'card' : 'pending',
      paymentStatus: paymentIntentId ? 'paid' : 'pending', // ✅ pending if no payment yet
      paymentIntentId: paymentIntentId || null,
      orderStatus: paymentIntentId ? 'processing' : 'pending',
      language,
    });

    // ✅ Only reduce stock if payment completed
    if (paymentIntentId) {
      for (const item of cart.items) {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { stock: -item.quantity },
        });
      }

      // Clear cart only if paid
      await Cart.findOneAndUpdate(
        { sessionId },
        { items: [], totalAmount: 0 }
      );
    }

    return ResponseHandler.success(res, 201, getMessage('ORDER_CREATED', language), {
      orderId: order.orderId,
      order,
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    next(error);
  }
};