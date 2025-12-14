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
  adminReactivationEmail,
} from "../utils/emailService.js";

// Lazy initialize Resend (only when actually sending)
let resend = null;
const getResend = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// From email address (must be verified in Resend)
const FROM_EMAIL = process.env.FROM_EMAIL || "AfroLuxe <noreply@afroluxe.no>";

/**
 * Send email using Resend
 */
const sendEmail = async (to, subject, html, text) => {
  console.log("📧 Attempting to send email...");
  console.log("   To:", to);
  console.log("   Subject:", subject);
  console.log("   API Key set:", !!process.env.RESEND_API_KEY);
  console.log("   From:", FROM_EMAIL);

  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 EMAIL (Dev Mode - No API Key)");
      console.log("---");
      return { success: true, dev: true };
    }

    const resendClient = getResend();
    if (!resendClient) {
      console.error("❌ Failed to initialize Resend client");
      return { success: false, error: "Resend client initialization failed" };
    }

    const { data, error } = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      return { success: false, error: error.message || JSON.stringify(error) };
    }

    console.log("✅ Email sent successfully! ID:", data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error("❌ Exception sending email:", error.message);
    console.error("   Stack:", error.stack);
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

/**
 * Send reactivation email to reactivated admin
 * @param {Object} admin - Reactivated admin
 */
export const sendReactivationEmail = async (admin) => {
  const loginUrl = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/admin/login`;
  const template = adminReactivationEmail(admin, loginUrl);

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
  sendReactivationEmail,
};
