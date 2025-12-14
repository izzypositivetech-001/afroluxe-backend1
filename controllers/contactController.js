/**
 * Contact Controller
 * Handle contact form submissions
 */

import { Resend } from "resend";
import ResponseHandler from "../utils/responseHandler.js";
import { contactFormTemplate } from "../utils/emailTemplates.js";

// Lazy initialize Resend
let resend = null;
const getResend = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@afroluxe.no";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@afroluxe.no";

/**
 * Submit contact form
 * POST /api/contact
 */
export const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    const language = req.language || "en";

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return ResponseHandler.error(
        res,
        400,
        language === "en"
          ? "Please fill in all required fields"
          : "Vennligst fyll ut alle påkrevde felt"
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResponseHandler.error(
        res,
        400,
        language === "en"
          ? "Please provide a valid email address"
          : "Vennligst oppgi en gyldig e-postadresse"
      );
    }

    // Generate email template
    const template = contactFormTemplate({ name, email, subject, message });

    // Send email to support
    const resendClient = getResend();
    if (resendClient) {
      try {
        const { data, error } = await resendClient.emails.send({
          from: FROM_EMAIL,
          to: [SUPPORT_EMAIL],
          replyTo: email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });

        if (error) {
          console.error("Failed to send contact email:", error);
          // Don't fail the request, just log the error
        } else {
          console.log("Contact email sent successfully:", data.id);
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }
    } else {
      console.log("📧 CONTACT FORM (Dev Mode - No API Key)");
      console.log("   From:", name, email);
      console.log("   Subject:", subject);
      console.log("   Message:", message);
    }

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? "Your message has been sent successfully"
        : "Din melding har blitt sendt",
      { received: true }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    next(error);
  }
};

export default { submitContactForm };
