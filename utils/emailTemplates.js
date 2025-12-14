/**
 * Email Templates
 * HTML email templates for various notifications
 */

/**
 * Base email template wrapper
 */
const emailWrapper = (content, language = "en") => {
  const heading = language === "en" ? "AfroLuxe" : "AfroLuxe";
  const footer =
    language === "en"
      ? "This is an automated email. Please do not reply."
      : "Dette er en automatisk e-post. Vennligst ikke svar.";

  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${heading}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .content { padding: 30px; }
        .footer { background: #f8f9fa; color: #6c757d; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #dee2e6; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .button:hover { background: #5568d3; }
        .order-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .order-item { padding: 10px 0; border-bottom: 1px solid #dee2e6; }
        .order-item:last-child { border-bottom: none; }
        .total { font-size: 18px; font-weight: bold; color: #667eea; margin-top: 15px; }
        .info-box { background: #e7f3ff; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
        .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
        .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${heading}</h1>
          <p>Premium Hair Extensions</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>${footer}</p>
          <p>© ${new Date().getFullYear()} AfroLuxe. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Order confirmation email
 */
export const orderConfirmationTemplate = (order, language = "en") => {
  const translations = {
    en: {
      subject: "Order Confirmation",
      title: "Thank you for your order!",
      intro: "We have received your order and will process it shortly.",
      orderId: "Order ID",
      orderDate: "Order Date",
      items: "Order Items",
      item: "Item",
      quantity: "Quantity",
      price: "Price",
      subtotal: "Subtotal",
      tax: "VAT (25%)",
      total: "Total",
      shipping: "Shipping Address",
      contact: "Contact",
      whatNext: "What happens next?",
      step1: "We will process your order",
      step2: "You will receive a shipping confirmation",
      step3: "Track your package",
      button: "View Order",
    },
    no: {
      subject: "Ordrebekreftelse",
      title: "Takk for din bestilling!",
      intro: "Vi har mottatt din bestilling og vil behandle den snart.",
      orderId: "Ordre-ID",
      orderDate: "Bestillingsdato",
      items: "Bestilte varer",
      item: "Vare",
      quantity: "Antall",
      price: "Pris",
      subtotal: "Delsum",
      tax: "MVA (25%)",
      total: "Totalt",
      shipping: "Leveringsadresse",
      contact: "Kontakt",
      whatNext: "Hva skjer videre?",
      step1: "Vi behandler din bestilling",
      step2: "Du vil motta en forsendelsesbekreftelse",
      step3: "Spor pakken din",
      button: "Vis bestilling",
    },
  };

  const t = translations[language];

  const itemsHtml = order.items
    .map(
      (item) => `
    <div class="order-item">
      <strong>${item.name[language]}</strong><br>
      ${t.quantity}: ${item.quantity} × ${item.price.toFixed(2)} NOK = ${(
        item.quantity * item.price
      ).toFixed(2)} NOK
    </div>
  `
    )
    .join("");

  const content = `
    <h2>${t.title}</h2>
    <p>${t.intro}</p>
    
    <div class="info-box">
      <p><strong>${t.orderId}:</strong> ${order.orderId}</p>
      <p><strong>${t.orderDate}:</strong> ${new Date(
    order.createdAt
  ).toLocaleDateString(language === "en" ? "en-US" : "nb-NO")}</p>
    </div>

    <div class="order-details">
      <h3>${t.items}</h3>
      ${itemsHtml}
      
      <table style="margin-top: 15px;">
        <tr>
          <td><strong>${t.subtotal}:</strong></td>
          <td style="text-align: right;">${order.subtotal.toFixed(2)} NOK</td>
        </tr>
        <tr>
          <td><strong>${t.tax}:</strong></td>
          <td style="text-align: right;">${order.tax.toFixed(2)} NOK</td>
        </tr>
        <tr>
          <td class="total"><strong>${t.total}:</strong></td>
          <td class="total" style="text-align: right;">${order.total.toFixed(
            2
          )} NOK</td>
        </tr>
      </table>
    </div>

    <div class="info-box">
      <h4>${t.shipping}</h4>
      <p>${order.shippingAddress.street}<br>
      ${order.shippingAddress.postalCode} ${order.shippingAddress.city}<br>
      ${order.shippingAddress.country}</p>
      
      <h4 style="margin-top: 15px;">${t.contact}</h4>
      <p>${order.customer.name}<br>
      ${order.customer.email}<br>
      ${order.customer.phone}</p>
    </div>

    <div class="success-box">
      <h4>${t.whatNext}</h4>
      <p>✓ ${t.step1}</p>
      <p>✓ ${t.step2}</p>
      <p>✓ ${t.step3}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL}/order/success?orderId=${
    order.orderId
  }" class="button">${t.button}</a>
    </div>
  `;

  return {
    subject: `${t.subject} - ${order.orderId}`,
    html: emailWrapper(content, language),
  };
};

/**
 * Order status update email
 */
export const orderStatusTemplate = (order, newStatus, language = "en") => {
  const translations = {
    en: {
      subject: "Order Status Update",
      title: "Your order status has been updated",
      orderId: "Order ID",
      newStatus: "New Status",
      statuses: {
        pending: "Pending",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
      },
      button: "Track Order",
    },
    no: {
      subject: "Ordre statusoppdatering",
      title: "Din ordrestatus er oppdatert",
      orderId: "Ordre-ID",
      newStatus: "Ny status",
      statuses: {
        pending: "Venter",
        processing: "Behandles",
        shipped: "Sendt",
        delivered: "Levert",
        cancelled: "Kansellert",
      },
      button: "Spor bestilling",
    },
  };

  const t = translations[language];

  const content = `
    <h2>${t.title}</h2>
    
    <div class="info-box">
      <p><strong>${t.orderId}:</strong> ${order.orderId}</p>
      <p><strong>${t.newStatus}:</strong> ${t.statuses[newStatus]}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL}/order/success?orderId=${order.orderId}" class="button">${t.button}</a>
    </div>
  `;

  return {
    subject: `${t.subject} - ${order.orderId}`,
    html: emailWrapper(content, language),
  };
};

/**
 * Shipping notification email
 */
export const shippingNotificationTemplate = (order, language = "en") => {
  const translations = {
    en: {
      subject: "Your order has been shipped",
      title: "📦 Your order is on its way!",
      intro:
        "Great news! Your order has been shipped and is on its way to you.",
      orderId: "Order ID",
      tracking: "Tracking Information",
      trackingNumber: "Tracking Number",
      carrier: "Carrier",
      estimatedDelivery: "Estimated Delivery",
      button: "Track Package",
    },
    no: {
      subject: "Din bestilling er sendt",
      title: "Bestillingen din er på vei!",
      intro: "Gode nyheter! Din bestilling er sendt og er på vei til deg.",
      orderId: "Ordre-ID",
      tracking: "Sporingsinformasjon",
      trackingNumber: "Sporingsnummer",
      carrier: "Transportør",
      estimatedDelivery: "Estimert levering",
      button: "Spor pakke",
    },
  };

  const t = translations[language];

  const content = `
    <h2>${t.title}</h2>
    <p>${t.intro}</p>
    
    <div class="info-box">
      <p><strong>${t.orderId}:</strong> ${order.orderId}</p>
    </div>

    <div class="success-box">
      <h4>${t.tracking}</h4>
      <p><strong>${t.trackingNumber}:</strong> ${
    order.trackingNumber || "N/A"
  }</p>
      <p><strong>${t.carrier}:</strong> ${order.carrier || "N/A"}</p>
      ${
        order.estimatedDelivery
          ? `<p><strong>${t.estimatedDelivery}:</strong> ${new Date(
              order.estimatedDelivery
            ).toLocaleDateString(language === "en" ? "en-US" : "nb-NO")}</p>`
          : ""
      }
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL}/order/success?orderId=${
    order.orderId
  }" class="button">${t.button}</a>
    </div>
  `;

  return {
    subject: `${t.subject} - ${order.orderId}`,
    html: emailWrapper(content, language),
  };
};

/**
 * Payment confirmation email
 */
export const paymentConfirmationTemplate = (order, language = "en") => {
  const translations = {
    en: {
      subject: "Payment Confirmed",
      title: "Payment Successful",
      intro: "Your payment has been successfully processed.",
      orderId: "Order ID",
      amount: "Amount Paid",
      method: "Payment Method",
      date: "Payment Date",
      button: "View Receipt",
    },
    no: {
      subject: "Betaling bekreftet",
      title: "Betaling vellykket",
      intro: "Din betaling er behandlet.",
      orderId: "Ordre-ID",
      amount: "Betalt beløp",
      method: "Betalingsmetode",
      date: "Betalingsdato",
      button: "Vis kvittering",
    },
  };

  const t = translations[language];

  const content = `
    <h2>${t.title}</h2>
    <p>${t.intro}</p>
    
    <div class="success-box">
      <p><strong>${t.orderId}:</strong> ${order.orderId}</p>
      <p><strong>${t.amount}:</strong> ${order.total.toFixed(2)} NOK</p>
      <p><strong>${t.method}:</strong> ${order.paymentMethod.toUpperCase()}</p>
      <p><strong>${t.date}:</strong> ${new Date().toLocaleDateString(
    language === "en" ? "en-US" : "nb-NO"
  )}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL}/order/success?orderId=${
    order.orderId
  }" class="button">${t.button}</a>
    </div>
  `;

  return {
    subject: `${t.subject} - ${order.orderId}`,
    html: emailWrapper(content, language),
  };
};

/**
 * Order cancellation email
 */
export const orderCancellationTemplate = (order, language = "en") => {
  const translations = {
    en: {
      subject: "Order Cancelled",
      title: "Order Cancellation",
      intro: "Your order has been cancelled.",
      orderId: "Order ID",
      refund: "Refund Information",
      refundText:
        "If you have already paid, a refund will be processed within 5-7 business days.",
      button: "View Order",
    },
    no: {
      subject: "Ordre kansellert",
      title: "Ordre kansellering",
      intro: "Din bestilling er kansellert.",
      orderId: "Ordre-ID",
      refund: "Refusjonsinformasjon",
      refundText:
        "Hvis du allerede har betalt, vil refusjon behandles innen 5-7 virkedager.",
      button: "Vis bestilling",
    },
  };

  const t = translations[language];

  const content = `
    <h2>${t.title}</h2>
    <p>${t.intro}</p>
    
    <div class="warning-box">
      <p><strong>${t.orderId}:</strong> ${order.orderId}</p>
    </div>

    ${
      order.paymentStatus === "paid"
        ? `
      <div class="info-box">
        <h4>${t.refund}</h4>
        <p>${t.refundText}</p>
      </div>
    `
        : ""
    }

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL}/order/success?orderId=${
    order.orderId
  }" class="button">${t.button}</a>
    </div>
  `;

  return {
    subject: `${t.subject} - ${order.orderId}`,
    html: emailWrapper(content, language),
  };
};

/**
 * Admin notification email
 */
export const adminNotificationTemplate = (type, data, language = "en") => {
  const translations = {
    en: {
      newOrder: "New Order Received",
      lowStock: "Low Stock Alert",
      orderCancelled: "Order Cancelled",
      button: "View in Admin Panel",
    },
    no: {
      newOrder: "Ny bestilling mottatt",
      lowStock: "Lav lagervarsel",
      orderCancelled: "Ordre kansellert",
      button: "Vis i adminpanel",
    },
  };

  const t = translations[language];

  let content = "";

  if (type === "new_order") {
    content = `
      <h2>${t.newOrder}</h2>
      <div class="info-box">
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Customer:</strong> ${data.customer}</p>
        <p><strong>Total:</strong> ${data.total} NOK</p>
      </div>
    `;
  } else if (type === "low_stock") {
    content = `
      <h2>${t.lowStock}</h2>
      <div class="warning-box">
        <p><strong>Product:</strong> ${data.productName}</p>
        <p><strong>Current Stock:</strong> ${data.stock}</p>
      </div>
    `;
  } else if (type === "order_cancelled") {
    content = `
      <h2>${t.orderCancelled}</h2>
      <div class="warning-box">
        <p><strong>Order ID:</strong> ${data.orderId}</p>
        <p><strong>Customer:</strong> ${data.customer}</p>
      </div>
    `;
  }

  content += `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL}/admin" class="button">${t.button}</a>
    </div>
  `;

  return {
    subject:
      type === "new_order"
        ? t.newOrder
        : type === "low_stock"
        ? t.lowStock
        : t.orderCancelled,
    html: emailWrapper(content, language),
  };
};

/**
 * Contact form email template
 */
export const contactFormTemplate = (contactData) => {
  const { name, email, subject, message } = contactData;

  const content = `
    <h2>New Contact Form Submission</h2>
    
    <div class="info-box">
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
    </div>

    <div class="order-details">
      <h4>Message:</h4>
      <p style="white-space: pre-wrap;">${message}</p>
    </div>

    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>Reply to:</strong> <a href="mailto:${email}">${email}</a>
      </p>
    </div>
  `;

  return {
    subject: `Contact Form: ${subject}`,
    html: emailWrapper(content, "en"),
    text: `
New Contact Form Submission

From: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Reply to: ${email}
    `,
  };
};

/**
 * Newsletter welcome email template
 */
export const newsletterWelcomeTemplate = (email, language = "en") => {
  const frontendUrl = process.env.FRONTEND_URL || "https://www.afroluxe.no";

  const t =
    {
      en: {
        subject: "Welcome to AfroLuxe Newsletter!",
        welcome: "Welcome to the Family!",
        intro:
          "Thank you for subscribing to our newsletter. You'll be the first to know about:",
        benefits: [
          "Exclusive offers and discounts",
          "New product launches",
          "Beauty tips and tutorials",
          "Special promotions",
        ],
        button: "Shop Now",
      },
      no: {
        subject: "Velkommen til AfroLuxe nyhetsbrev!",
        welcome: "Velkommen til familien!",
        intro:
          "Takk for at du abonnerer på nyhetsbrevet vårt. Du vil være den første til å få vite om:",
        benefits: [
          "Eksklusive tilbud og rabatter",
          "Nye produktlanseringer",
          "Skjønnhetstips og veiledninger",
          "Spesielle kampanjer",
        ],
        button: "Handle nå",
      },
    }[language] || {};

  const content = `
    <h2>${t.welcome}</h2>
    <p>${t.intro}</p>
    <ul>
      ${t.benefits.map((b) => `<li>${b}</li>`).join("")}
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${frontendUrl}/shop" class="button">${t.button}</a>
    </div>
    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      <a href="${frontendUrl}/unsubscribe?email=${encodeURIComponent(
    email
  )}">Unsubscribe</a>
    </p>
  `;

  return {
    subject: t.subject,
    html: emailWrapper(content, language),
  };
};

/**
 * New subscriber notification for admin
 */
export const newSubscriberNotificationTemplate = (subscriber) => {
  const content = `
    <h2>New Newsletter Subscriber!</h2>
    
    <div class="success-box">
      <p><strong>Email:</strong> ${subscriber.email}</p>
      <p><strong>Source:</strong> ${subscriber.source || "homepage"}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <p>A new user has subscribed to the AfroLuxe newsletter.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${
        process.env.FRONTEND_URL || "https://www.afroluxe.no"
      }/admin/newsletter" class="button">View Subscribers</a>
    </div>
  `;

  return {
    subject: `New Newsletter Subscriber: ${subscriber.email}`,
    html: emailWrapper(content, "en"),
  };
};
