/**
 * Email Service
 * Send emails using Resend with HTML templates
 */

import { Resend } from "resend";
import {
  orderConfirmationTemplate,
  orderStatusTemplate,
  shippingNotificationTemplate,
  paymentConfirmationTemplate,
  orderCancellationTemplate,
  adminNotificationTemplate,
} from "./emailTemplates.js";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// From email address (must be verified in Resend)
const FROM_EMAIL = process.env.FROM_EMAIL || "AfroLuxe <noreply@afroluxe.no>";

// Log email service status on load
if (process.env.RESEND_API_KEY) {
  console.log("Email service ready (Resend)");
} else {
  console.warn("RESEND_API_KEY not configured - emails will be logged only");
}

/**
 * Send email helper using Resend
 */
const sendEmail = async (to, subject, html) => {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 EMAIL (Dev Mode - No API Key)");
      console.log("To:", to);
      console.log("Subject:", subject);
      console.log("---");
      return { success: true, dev: true };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("📧 Email sent:", data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Email send error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmation = async (order, language = "en") => {
  const { subject, html } = orderConfirmationTemplate(order, language);
  return await sendEmail(order.customer.email, subject, html);
};

/**
 * Send order status update email
 */
export const sendOrderStatusUpdate = async (
  order,
  newStatus,
  language = "en"
) => {
  const { subject, html } = orderStatusTemplate(order, newStatus, language);
  return await sendEmail(order.customer.email, subject, html);
};

/**
 * Send shipping notification email
 */
export const sendShippingNotification = async (order, language = "en") => {
  const { subject, html } = shippingNotificationTemplate(order, language);
  return await sendEmail(order.customer.email, subject, html);
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = async (order, language = "en") => {
  const { subject, html } = paymentConfirmationTemplate(order, language);
  return await sendEmail(order.customer.email, subject, html);
};

/**
 * Send order cancellation email
 */
export const sendOrderCancellation = async (order, language = "en") => {
  const { subject, html } = orderCancellationTemplate(order, language);
  return await sendEmail(order.customer.email, subject, html);
};

/**
 * Send admin notification email
 */
export const sendAdminNotification = async (type, data, language = "en") => {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not configured, skipping admin notification");
    return { success: false, error: "Admin email not configured" };
  }

  const { subject, html } = adminNotificationTemplate(type, data, language);
  return await sendEmail(adminEmail, subject, html);
};

/**
 * Send new order notification to admin
 */
export const notifyAdminNewOrder = async (order) => {
  return await sendAdminNotification("new_order", {
    orderId: order.orderId,
    customer: order.customer.name,
    total: order.total.toFixed(2),
  });
};

/**
 * Send low stock alert to admin
 */
export const notifyAdminLowStock = async (product, language = "en") => {
  return await sendAdminNotification("low_stock", {
    productName: product.name[language],
    stock: product.stock,
  });
};

/**
 * Send order cancellation notification to admin
 */
export const notifyAdminOrderCancelled = async (order) => {
  return await sendAdminNotification("order_cancelled", {
    orderId: order.orderId,
    customer: order.customer.name,
  });
};

/**
 * Email template for admin registration notification (to super admin)
 * @param {Object} admin - Pending admin data
 * @param {string} dashboardUrl - Admin dashboard URL
 */
export const adminRegistrationNotification = (admin, dashboardUrl) => {
  return {
    subject: "New Admin Registration Request - AfroLuxe",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1A1A1A 0%, #4A5568 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-size: 28px; font-weight: bold; }
          .gold { color: #C9A961; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
          .admin-card { background: #F5F3EF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C9A961; }
          .button { display: inline-block; padding: 12px 30px; background: #C9A961; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
          .button:hover { background: #B89951; }
          .button-secondary { background: #E8D5D0; color: #1A1A1A; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .info { background: #E3F2FD; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2196F3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Afro<span class="gold">Luxe</span></div>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Admin Management</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1A1A1A; margin-top: 0;">New Admin Registration Request</h2>
            
            <p>A new admin has requested access to the AfroLuxe admin panel.</p>
            
            <div class="admin-card">
              <h3 style="margin-top: 0; color: #C9A961;">Pending Admin Details</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${admin.name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${
                admin.email
              }</p>
              <p style="margin: 5px 0;"><strong>Requested:</strong> ${new Date().toLocaleDateString(
                "en-US",
                { year: "numeric", month: "long", day: "numeric" }
              )}</p>
            </div>
            
            <div class="info">
              <p style="margin: 0;"><strong>⚠️ Action Required</strong></p>
              <p style="margin: 5px 0 0 0;">Please review this request and approve or reject it from your admin dashboard.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}/admin/management" class="button">Review Request</a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you didn't expect this request or don't recognize this person, please reject it immediately.
            </p>
          </div>
          
          <div class="footer">
            <p>AfroLuxe - Premium Hair Extensions</p>
            <p>This is an automated notification from your admin system.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
New Admin Registration Request - AfroLuxe

A new admin has requested access to the AfroLuxe admin panel.

Pending Admin Details:
Name: ${admin.name}
Email: ${admin.email}
Requested: ${new Date().toLocaleDateString()}

Action Required:
Please review this request and approve or reject it from your admin dashboard.

Review Request: ${dashboardUrl}/admin/management

If you didn't expect this request or don't recognize this person, please reject it immediately.

---
AfroLuxe - Premium Hair Extensions
This is an automated notification from your admin system.
    `,
  };
};

/**
 * Email template for admin approval (to approved admin)
 * @param {Object} admin - Approved admin data
 * @param {string} loginUrl - Admin login URL
 */
export const adminApprovalEmail = (admin, loginUrl) => {
  return {
    subject: "Admin Account Approved - AfroLuxe",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1A1A1A 0%, #4A5568 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-size: 28px; font-weight: bold; }
          .gold { color: #C9A961; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
          .success-card { background: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; text-align: center; }
          .button { display: inline-block; padding: 12px 30px; background: #C9A961; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
          .button:hover { background: #B89951; }
          .features { background: #F5F3EF; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .feature-item { margin: 10px 0; padding-left: 25px; position: relative; }
          .feature-item:before { content: "✓"; position: absolute; left: 0; color: #4CAF50; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Afro<span class="gold">Luxe</span></div>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Admin Panel</p>
          </div>
          
          <div class="content">
            <div class="success-card">
              <h2 style="color: #4CAF50; margin-top: 0;">🎉 Account Approved!</h2>
              <p style="font-size: 18px; margin: 10px 0;">Welcome to the AfroLuxe admin team, ${admin.name}!</p>
            </div>
            
            <p>Your admin account has been approved by the super administrator. You now have access to the AfroLuxe admin panel.</p>
            
            <div class="features">
              <h3 style="margin-top: 0; color: #1A1A1A;">What you can do:</h3>
              <div class="feature-item">Manage products and inventory</div>
              <div class="feature-item">Process and track orders</div>
              <div class="feature-item">View customer information</div>
              <div class="feature-item">Access sales analytics</div>
              <div class="feature-item">Manage categories and coupons</div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" class="button">Login to Admin Panel</a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>Your login credentials:</strong><br>
              Email: ${admin.email}<br>
              Password: (the password you used during registration)
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If you have any questions or need assistance, please contact the super administrator.
            </p>
          </div>
          
          <div class="footer">
            <p>AfroLuxe - Premium Hair Extensions</p>
            <p>This is an automated notification from your admin system.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Admin Account Approved - AfroLuxe

🎉 Account Approved!

Welcome to the AfroLuxe admin team, ${admin.name}!

Your admin account has been approved by the super administrator. You now have access to the AfroLuxe admin panel.

What you can do:
✓ Manage products and inventory
✓ Process and track orders
✓ View customer information
✓ Access sales analytics
✓ Manage categories and coupons

Login to Admin Panel: ${loginUrl}

Your login credentials:
Email: ${admin.email}
Password: (the password you used during registration)

If you have any questions or need assistance, please contact the super administrator.

---
AfroLuxe - Premium Hair Extensions
This is an automated notification from your admin system.
    `,
  };
};

/**
 * Email template for admin rejection (to rejected admin)
 * @param {Object} admin - Rejected admin data
 */
export const adminRejectionEmail = (admin) => {
  return {
    subject: "Admin Registration Update - AfroLuxe",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1A1A1A 0%, #4A5568 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-size: 28px; font-weight: bold; }
          .gold { color: #C9A961; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
          .info-card { background: #FFF3E0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Afro<span class="gold">Luxe</span></div>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Admin Panel</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1A1A1A; margin-top: 0;">Admin Registration Update</h2>
            
            <p>Dear ${admin.name},</p>
            
            <div class="info-card">
              <p style="margin: 0;">Your admin registration request for AfroLuxe has not been approved at this time.</p>
            </div>
            
            <p>If you believe this is an error or would like more information, please contact the super administrator directly.</p>
            
            <p>Thank you for your interest in joining the AfroLuxe admin team.</p>
          </div>
          
          <div class="footer">
            <p>AfroLuxe - Premium Hair Extensions</p>
            <p>This is an automated notification from your admin system.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Admin Registration Update - AfroLuxe

Dear ${admin.name},

Your admin registration request for AfroLuxe has not been approved at this time.

If you believe this is an error or would like more information, please contact the super administrator directly.

Thank you for your interest in joining the AfroLuxe admin team.

---
AfroLuxe - Premium Hair Extensions
This is an automated notification from your admin system.
    `,
  };
};

/**
 * Email template for admin suspension (to suspended admin)
 * @param {Object} admin - Suspended admin data
 */
export const adminSuspensionEmail = (admin) => {
  return {
    subject: "Admin Account Suspended - AfroLuxe",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1A1A1A 0%, #4A5568 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-size: 28px; font-weight: bold; }
          .gold { color: #C9A961; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
          .warning-card { background: #FFEBEE; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F44336; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Afro<span class="gold">Luxe</span></div>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Admin Panel</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1A1A1A; margin-top: 0;">Account Suspended</h2>
            
            <p>Dear ${admin.name},</p>
            
            <div class="warning-card">
              <p style="margin: 0; font-weight: bold;">Your admin account has been suspended.</p>
            </div>
            
            <p>You no longer have access to the AfroLuxe admin panel. If you attempt to login, you will see an error message.</p>
            
            <p>If you believe this is an error or need clarification, please contact the super administrator.</p>
          </div>
          
          <div class="footer">
            <p>AfroLuxe - Premium Hair Extensions</p>
            <p>This is an automated notification from your admin system.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Admin Account Suspended - AfroLuxe

Dear ${admin.name},

Your admin account has been suspended.

You no longer have access to the AfroLuxe admin panel. If you attempt to login, you will see an error message.

If you believe this is an error or need clarification, please contact the super administrator.

---
AfroLuxe - Premium Hair Extensions
This is an automated notification from your admin system.
    `,
  };
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
  notifyAdminOrderCancelled,
  adminApprovalEmail,
  adminRejectionEmail,
  adminSuspensionEmail,
};
