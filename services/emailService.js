/**
 * Email Service - Resend Integration
 * Uses Resend for sending admin notification emails
 */

import { Resend } from "resend";
import {
  adminRegistrationNotification,
  adminApprovalEmail,
  adminRejectionEmail,
  adminSuspensionEmail,
} from "../utils/emailService.js";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// From email address (must be verified in Resend)
const FROM_EMAIL = process.env.FROM_EMAIL || "AfroLuxe <noreply@afroluxe.no>";

/**
 * Send email using Resend
 */
const sendEmail = async (to, subject, html, text) => {
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
      text,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("📧 Email sent:", data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send admin registration notification to super admin
 * @param {Object} admin - Pending admin
 * @param {string} superAdminEmail - Super admin email
 */
export const sendAdminRegistrationNotification = async (
  admin,
  superAdminEmail
) => {
  const dashboardUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const template = adminRegistrationNotification(admin, dashboardUrl);

  return await sendEmail(
    superAdminEmail,
    template.subject,
    template.html,
    template.text
  );
};

/**
 * Send approval email to approved admin
 * @param {Object} admin - Approved admin
 */
export const sendApprovalEmail = async (admin) => {
  const loginUrl = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/admin/login`;
  const template = adminApprovalEmail(admin, loginUrl);

  return await sendEmail(
    admin.email,
    template.subject,
    template.html,
    template.text
  );
};

/**
 * Send rejection email to rejected admin
 * @param {Object} admin - Rejected admin
 */
export const sendRejectionEmail = async (admin) => {
  const template = adminRejectionEmail(admin);

  return await sendEmail(
    admin.email,
    template.subject,
    template.html,
    template.text
  );
};

/**
 * Send suspension email to suspended admin
 * @param {Object} admin - Suspended admin
 */
export const sendSuspensionEmail = async (admin) => {
  const template = adminSuspensionEmail(admin);

  return await sendEmail(
    admin.email,
    template.subject,
    template.html,
    template.text
  );
};

export default {
  sendAdminRegistrationNotification,
  sendApprovalEmail,
  sendRejectionEmail,
  sendSuspensionEmail,
};
