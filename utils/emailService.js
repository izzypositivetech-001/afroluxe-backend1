/**
 * Email Service
 * Send emails using Nodemailer with HTML templates
 */

import nodemailer from 'nodemailer';
import {
  orderConfirmationTemplate,
  orderStatusTemplate,
  shippingNotificationTemplate,
  paymentConfirmationTemplate,
  orderCancellationTemplate,
  adminNotificationTemplate
} from './emailTemplates.js';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Test transporter on load
try {
  const testTransporter = createTransporter();
  testTransporter.verify((error, success) => {
    if (error) {
      console.error('Email transporter error:', error.message);
    } else {
      console.log('Email service ready');
    }
  });
} catch (error) {
  console.error('Email configuration error:', error.message);
}

/**
 * Send email helper
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `AfroLuxe <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmation = async (order, language = 'en') => {
  const { subject, html } = orderConfirmationTemplate(order, language);
  return await sendEmail(order.customer.email, subject, html);
};

/**
 * Send order status update email
 */
export const sendOrderStatusUpdate = async (order, newStatus, language = 'en') => {
  const { subject, html } = orderStatusTemplate(order, newStatus, language);
  return await sendEmail(order.customer.email, subject, html);
};

/**
 * Send shipping notification email
 */
export const sendShippingNotification = async (order, language = 'en') => {
  const { subject, html } = shippingNotificationTemplate(order, language);
  return await sendEmail(order.customer.email, subject, html);
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = async (order, language = 'en') => {
  const { subject, html } = paymentConfirmationTemplate(order, language);
  return await sendEmail(order.customer.email, subject, html);
};

/**
 * Send order cancellation email
 */
export const sendOrderCancellation = async (order, language = 'en') => {
  const { subject, html } = orderCancellationTemplate(order, language);
  return await sendEmail(order.customer.email, subject, html);
};

/**
 * Send admin notification email
 */
export const sendAdminNotification = async (type, data, language = 'en') => {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured, skipping admin notification');
    return { success: false, error: 'Admin email not configured' };
  }

  const { subject, html } = adminNotificationTemplate(type, data, language);
  return await sendEmail(adminEmail, subject, html);
};

/**
 * Send new order notification to admin
 */
export const notifyAdminNewOrder = async (order) => {
  return await sendAdminNotification('new_order', {
    orderId: order.orderId,
    customer: order.customer.name,
    total: order.total.toFixed(2)
  });
};

/**
 * Send low stock alert to admin
 */
export const notifyAdminLowStock = async (product, language = 'en') => {
  return await sendAdminNotification('low_stock', {
    productName: product.name[language],
    stock: product.stock
  });
};

/**
 * Send order cancellation notification to admin
 */
export const notifyAdminOrderCancelled = async (order) => {
  return await sendAdminNotification('order_cancelled', {
    orderId: order.orderId,
    customer: order.customer.name
  });
};

export default {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendShippingNotification,
  sendPaymentConfirmation,
  sendOrderCancellation,
  sendAdminNotification,
  notifyAdminNewOrder,
  notifyAdminLowStock,
  notifyAdminOrderCancelled
};