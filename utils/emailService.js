/**
 * Email Service
 * Handles sending emails for orders and notifications
 */

import nodemailer from "nodemailer";

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmation = async (order, language = "en") => {
  try {
    const transporter = createTransporter();

    const subject =
      language === "en"
        ? `Order Confirmation - ${order.orderId}`
        : `Ordrebekreftelse - ${order.orderId}`;

    const greeting =
      language === "en"
        ? `Dear ${order.customer.name},`
        : `Kjære ${order.customer.name},`;

    const thankYou =
      language === "en"
        ? "Thank you for your order!"
        : "Takk for din bestilling!";

    const orderDetails =
      language === "en" ? "Order Details:" : "Bestillingsdetaljer:";

    const shippingInfo =
      language === "en" ? "Shipping Address:" : "Leveringsadresse:";

    const itemsList = order.items
      .map(
        (item) =>
          `${item.name[language]} x ${item.quantity} - ${item.price} NOK`
      )
      .join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${thankYou}</h2>
        <p>${greeting}</p>
        <p>${
          language === "en"
            ? "Your order has been received and is being processed."
            : "Din bestilling er mottatt og behandles."
        }</p>
        
        <h3>${orderDetails}</h3>
        <p><strong>${
          language === "en" ? "Order ID" : "Bestillings-ID"
        }:</strong> ${order.orderId}</p>
        <p><strong>${
          language === "en" ? "Order Date" : "Bestillingsdato"
        }:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        
        <h4>${language === "en" ? "Items:" : "Varer:"}</h4>
        <pre>${itemsList}</pre>
        
        <div style="margin-top: 20px; padding: 10px; background-color: #f5f5f5;">
          <p><strong>${language === "en" ? "Subtotal" : "Delsum"}:</strong> ${
      order.subtotal
    } NOK</p>
          <p><strong>${
            language === "en" ? "Tax (25% MVA)" : "Skatt (25% MVA)"
          }:</strong> ${order.tax} NOK</p>
          <p><strong>${language === "en" ? "Shipping" : "Frakt"}:</strong> ${
      order.shippingFee
    } NOK</p>
          <p style="font-size: 18px;"><strong>${
            language === "en" ? "Total" : "Totalt"
          }:</strong> ${order.total} NOK</p>
        </div>
        
        <h4>${shippingInfo}</h4>
        <p>
          ${order.shippingAddress.street}<br>
          ${order.shippingAddress.postalCode} ${order.shippingAddress.city}<br>
          ${order.shippingAddress.country}
        </p>
        
        <p style="margin-top: 30px;">
          ${
            language === "en"
              ? "You can track your order status at any time."
              : "Du kan spore bestillingsstatus når som helst."
          }
        </p>
        
        <p>
          ${language === "en" ? "Best regards," : "Med vennlig hilsen,"}<br>
          <strong>AfroLuxe Team</strong>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"AfroLuxe" <${process.env.EMAIL_USER}>`,
      to: order.customer.email,
      subject,
      html,
    });

    console.log(`Order confirmation email sent to ${order.customer.email}`);
    return true;
  } catch (error) {
    console.error("Error sending order confirmation email:", error.message);
    return false;
  }
};

/**
 * Send order status update email
 */
export const sendOrderStatusUpdate = async (
  order,
  newStatus,
  language = "en"
) => {
  try {
    const transporter = createTransporter();

    const statusMessages = {
      processing: {
        en: "Your order is being processed",
        no: "Din bestilling behandles",
      },
      shipped: {
        en: "Your order has been shipped",
        no: "Din bestilling er sendt",
      },
      delivered: {
        en: "Your order has been delivered",
        no: "Din bestilling er levert",
      },
      cancelled: {
        en: "Your order has been cancelled",
        no: "Din bestilling er kansellert",
      },
    };

    const subject =
      language === "en"
        ? `Order Update - ${order.orderId}`
        : `Bestillingsoppdatering - ${order.orderId}`;

    const statusMessage = statusMessages[newStatus]?.[language] || newStatus;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${statusMessage}</h2>
        <p>${language === "en" ? "Dear" : "Kjære"} ${order.customer.name},</p>
        <p>${
          language === "en"
            ? `Your order ${order.orderId} status has been updated to: ${newStatus}`
            : `Din bestilling ${order.orderId} status er oppdatert til: ${newStatus}`
        }</p>
        
        <p style="margin-top: 30px;">
          ${language === "en" ? "Best regards," : "Med vennlig hilsen,"}<br>
          <strong>AfroLuxe Team</strong>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"AfroLuxe" <${process.env.EMAIL_USER}>`,
      to: order.customer.email,
      subject,
      html,
    });

    console.log(`Order status update email sent to ${order.customer.email}`);
    return true;
  } catch (error) {
    console.error("Error sending status update email:", error.message);
    return false;
  }
};
