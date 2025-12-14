/**
 * Newsletter Controller
 * Handle newsletter subscriptions
 */

import Subscriber from "../models/subscriber.js";
import { Resend } from "resend";
import ResponseHandler from "../utils/responseHandler.js";
import {
  newsletterWelcomeTemplate,
  newSubscriberNotificationTemplate,
} from "../utils/emailTemplates.js";

// Lazy initialize Resend
let resend = null;
const getResend = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@afroluxe.no";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@afroluxe.no";

/**
 * Subscribe to newsletter
 * POST /api/newsletter/subscribe
 */
export const subscribe = async (req, res, next) => {
  try {
    const { email, source = "homepage" } = req.body;
    const language = req.language || "en";

    // Validate email
    if (!email) {
      return ResponseHandler.error(
        res,
        400,
        language === "en" ? "Email is required" : "E-post er påkrevd"
      );
    }

    // Check if already subscribed
    const existingSubscriber = await Subscriber.findOne({
      email: email.toLowerCase(),
    });

    if (existingSubscriber) {
      if (existingSubscriber.status === "active") {
        return ResponseHandler.success(
          res,
          200,
          language === "en"
            ? "You are already subscribed!"
            : "Du er allerede abonnent!",
          { alreadySubscribed: true }
        );
      } else {
        // Reactivate subscription
        existingSubscriber.status = "active";
        existingSubscriber.subscribedAt = new Date();
        existingSubscriber.unsubscribedAt = null;
        await existingSubscriber.save();

        return ResponseHandler.success(
          res,
          200,
          language === "en"
            ? "Welcome back! Your subscription has been reactivated."
            : "Velkommen tilbake! Abonnementet ditt er reaktivert.",
          { reactivated: true }
        );
      }
    }

    // Create new subscriber
    const subscriber = await Subscriber.create({
      email: email.toLowerCase(),
      source,
    });

    // Send emails
    const resendClient = getResend();
    if (resendClient) {
      // Send welcome email to subscriber
      try {
        const welcomeTemplate = newsletterWelcomeTemplate(email, language);
        await resendClient.emails.send({
          from: FROM_EMAIL,
          to: [email],
          subject: welcomeTemplate.subject,
          html: welcomeTemplate.html,
        });
        console.log("Welcome email sent to subscriber:", email);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      // Send notification to admin
      try {
        const adminTemplate = newSubscriberNotificationTemplate(subscriber);
        await resendClient.emails.send({
          from: FROM_EMAIL,
          to: [ADMIN_EMAIL],
          subject: adminTemplate.subject,
          html: adminTemplate.html,
        });
        console.log("Admin notified of new subscriber:", email);
      } catch (emailError) {
        console.error("Failed to notify admin:", emailError);
      }
    }

    return ResponseHandler.success(
      res,
      201,
      language === "en"
        ? "Successfully subscribed! Check your email for a welcome offer."
        : "Abonnement vellykket! Sjekk e-posten din for et velkomsttilbud.",
      { subscribed: true }
    );
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return ResponseHandler.success(res, 200, "You are already subscribed!", {
        alreadySubscribed: true,
      });
    }
    console.error("Newsletter subscription error:", error);
    next(error);
  }
};

/**
 * Unsubscribe from newsletter
 * POST /api/newsletter/unsubscribe
 */
export const unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    const language = req.language || "en";

    if (!email) {
      return ResponseHandler.error(res, 400, "Email is required");
    }

    const subscriber = await Subscriber.findOne({ email: email.toLowerCase() });

    if (!subscriber) {
      return ResponseHandler.error(
        res,
        404,
        language === "en"
          ? "Email not found in our subscription list"
          : "E-post ikke funnet i abonnentlisten"
      );
    }

    subscriber.status = "unsubscribed";
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return ResponseHandler.success(
      res,
      200,
      language === "en"
        ? "You have been unsubscribed successfully"
        : "Du er nå avmeldt",
      { unsubscribed: true }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all subscribers (Admin)
 * GET /api/newsletter/subscribers
 */
export const getSubscribers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const language = req.language || "en";

    const query = {};
    if (status) query.status = status;

    const subscribers = await Subscriber.find(query)
      .sort({ subscribedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Subscriber.countDocuments(query);
    const activeCount = await Subscriber.countDocuments({ status: "active" });

    return ResponseHandler.success(res, 200, "Success", {
      subscribers,
      stats: {
        total,
        active: activeCount,
        unsubscribed: total - activeCount,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { subscribe, unsubscribe, getSubscribers };
