/**
 * Notification Controller
 * Manage and send notifications
 */

import Order from '../models/order.js';
import Product from '../models/product.js';
import ResponseHandler from '../utils/responseHandler.js';
import { getMessage } from '../utils/translations.js';
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendShippingNotification,
  sendPaymentConfirmation,
  sendOrderCancellation,
  notifyAdminNewOrder,
  notifyAdminLowStock,
  notifyAdminOrderCancelled
} from '../utils/emailService.js';

/**
 * Test email sending
 * POST /api/admin/notifications/test-email
 */
export const testEmail = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { email } = req.body;

    if (!email) {
      return ResponseHandler.error(
        res,
        400,
        language === 'en' ? 'Email address is required' : 'E-postadresse er påkrevd'
      );
    }

    // Create a test order object
    const testOrder = {
      orderId: 'TEST-2024-0001',
      customer: {
        name: 'Test Customer',
        email: email,
        phone: '+47 123 45 678'
      },
      items: [
        {
          name: { en: 'Test Product', no: 'Test Produkt' },
          quantity: 2,
          price: 999
        }
      ],
      subtotal: 1998,
      tax: 499.5,
      total: 2497.5,
      shippingAddress: {
        address: 'Test Street 123',
        postalCode: '0123',
        city: 'Oslo',
        country: 'Norway'
      },
      createdAt: new Date()
    };

    const result = await sendOrderConfirmation(testOrder, language);

    if (result.success) {
      return ResponseHandler.success(
        res,
        200,
        language === 'en' ? 'Test email sent successfully' : 'Test e-post sendt vellykket',
        { messageId: result.messageId }
      );
    } else {
      return ResponseHandler.error(
        res,
        500,
        language === 'en' ? 'Failed to send test email' : 'Kunne ikke sende test e-post',
        { error: result.error }
      );
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Resend order confirmation
 * POST /api/admin/notifications/resend-confirmation/:orderId
 */
export const resendOrderConfirmation = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const language = req.language || 'en';

    const order = await Order.findOne({ orderId });

    if (!order) {
      return ResponseHandler.error(
        res,
        404,
        language === 'en' ? 'Order not found' : 'Bestilling ikke funnet'
      );
    }

    const result = await sendOrderConfirmation(order, language);

    if (result.success) {
      return ResponseHandler.success(
        res,
        200,
        language === 'en' ? 'Order confirmation resent' : 'Ordrebekreftelse sendt på nytt',
        { orderId: order.orderId, email: order.customer.email }
      );
    } else {
      return ResponseHandler.error(
        res,
        500,
        language === 'en' ? 'Failed to resend email' : 'Kunne ikke sende e-post på nytt',
        { error: result.error }
      );
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Send shipping notification
 * POST /api/admin/notifications/shipping/:orderId
 */
export const sendShipping = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const language = req.language || 'en';

    const order = await Order.findOne({ orderId });

    if (!order) {
      return ResponseHandler.error(
        res,
        404,
        language === 'en' ? 'Order not found' : 'Bestilling ikke funnet'
      );
    }

    if (!order.trackingNumber) {
      return ResponseHandler.error(
        res,
        400,
        language === 'en' ? 'Tracking number not set' : 'Sporingsnummer ikke angitt'
      );
    }

    const result = await sendShippingNotification(order, language);

    if (result.success) {
      return ResponseHandler.success(
        res,
        200,
        language === 'en' ? 'Shipping notification sent' : 'Forsendelsesvarsel sendt',
        { orderId: order.orderId, email: order.customer.email }
      );
    } else {
      return ResponseHandler.error(
        res,
        500,
        language === 'en' ? 'Failed to send notification' : 'Kunne ikke sende varsel',
        { error: result.error }
      );
    }

  } catch (error) {
    next(error);
  }
};

/**
 * Check low stock products and notify
 * POST /api/admin/notifications/check-low-stock
 */
export const checkLowStock = async (req, res, next) => {
  try {
    const language = req.language || 'en';
    const { threshold = 10 } = req.body;

    // Find products with low stock
    const lowStockProducts = await Product.find({
      stock: { $gt: 0, $lt: parseInt(threshold) }
    });

    // Send notifications for each low stock product
    const notifications = [];
    for (const product of lowStockProducts) {
      const result = await notifyAdminLowStock(product, language);
      notifications.push({
        productId: product._id,
        productName: product.name[language],
        stock: product.stock,
        notified: result.success
      });
    }

    return ResponseHandler.success(
      res,
      200,
      language === 'en' 
        ? `Low stock check complete. ${notifications.length} products checked.`
        : `Lav lager-sjekk fullført. ${notifications.length} produkter sjekket.`,
      {
        threshold,
        lowStockCount: notifications.length,
        products: notifications
      }
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Get notification settings
 * GET /api/admin/notifications/settings
 */
export const getNotificationSettings = async (req, res, next) => {
  try {
    const language = req.language || 'en';

    const settings = {
      emailService: {
        configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
        service: process.env.EMAIL_SERVICE || 'gmail',
        from: process.env.EMAIL_USER || 'Not configured'
      },
      notifications: {
        orderConfirmation: true,
        statusUpdates: true,
        shippingNotifications: true,
        paymentConfirmations: true,
        adminNotifications: !!process.env.ADMIN_EMAIL
      },
      adminEmail: process.env.ADMIN_EMAIL || 'Not configured'
    };

    return ResponseHandler.success(
      res,
      200,
      getMessage('SUCCESS', language),
      settings
    );

  } catch (error) {
    next(error);
  }
};