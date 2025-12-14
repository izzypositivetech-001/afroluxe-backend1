/**
 * Email Service Test Script
 * Tests all email functionality
 *
 * Run with: node scripts/testEmails.js
 */

import dotenv from "dotenv";
dotenv.config();

// Test Admin Emails (from services/emailService.js)
import {
  sendAdminRegistrationNotification,
  sendApprovalEmail,
  sendRejectionEmail,
  sendSuspensionEmail,
} from "../services/emailService.js";

// Test Order Emails (from utils/emailService.js)
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendShippingNotification,
  sendPaymentConfirmation,
  sendOrderCancellation,
  notifyAdminNewOrder,
} from "../utils/emailService.js";

// Test data
const testAdmin = {
  _id: "123456789",
  name: "Test Admin",
  email: process.env.TEST_EMAIL || "test@example.com",
};

const testOrder = {
  orderId: "ALX-2024-0001",
  createdAt: new Date(),
  customer: {
    name: "John Doe",
    email: process.env.TEST_EMAIL || "test@example.com",
    phone: "+47 123 456 789",
  },
  shippingAddress: {
    street: "123 Main Street",
    city: "Oslo",
    postalCode: "0123",
    country: "Norway",
  },
  items: [
    {
      name: { en: "Premium Hair Extensions", no: "Premium hårforlengelser" },
      quantity: 2,
      price: 599.99,
    },
    {
      name: { en: "Hair Care Set", no: "Hårpleiesett" },
      quantity: 1,
      price: 299.99,
    },
  ],
  subtotal: 1499.97,
  tax: 374.99,
  total: 1874.96,
  paymentMethod: "stripe",
  paymentStatus: "paid",
  orderStatus: "pending",
};

const runTests = async () => {
  console.log("\n🧪 Starting Email Service Tests\n");
  console.log("=".repeat(50));

  // Check API key
  if (!process.env.RESEND_API_KEY) {
    console.log(
      "⚠️  RESEND_API_KEY not set - emails will be logged only (dev mode)\n"
    );
  } else {
    console.log("✅ RESEND_API_KEY configured\n");
  }

  const results = [];

  // Test 1: Admin Registration Notification
  console.log("1️⃣ Testing: Admin Registration Notification");
  try {
    const result = await sendAdminRegistrationNotification(
      testAdmin,
      testAdmin.email
    );
    results.push({
      test: "Admin Registration",
      success: result.success,
      result,
    });
    console.log(
      `   ${result.success ? "✅" : "❌"} ${
        result.success ? "Passed" : "Failed"
      }`
    );
  } catch (error) {
    results.push({
      test: "Admin Registration",
      success: false,
      error: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Admin Approval Email
  console.log("2️⃣ Testing: Admin Approval Email");
  try {
    const result = await sendApprovalEmail(testAdmin);
    results.push({ test: "Admin Approval", success: result.success, result });
    console.log(
      `   ${result.success ? "✅" : "❌"} ${
        result.success ? "Passed" : "Failed"
      }`
    );
  } catch (error) {
    results.push({
      test: "Admin Approval",
      success: false,
      error: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Admin Rejection Email
  console.log("3️⃣ Testing: Admin Rejection Email");
  try {
    const result = await sendRejectionEmail(testAdmin);
    results.push({ test: "Admin Rejection", success: result.success, result });
    console.log(
      `   ${result.success ? "✅" : "❌"} ${
        result.success ? "Passed" : "Failed"
      }`
    );
  } catch (error) {
    results.push({
      test: "Admin Rejection",
      success: false,
      error: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: Admin Suspension Email
  console.log("4️⃣ Testing: Admin Suspension Email");
  try {
    const result = await sendSuspensionEmail(testAdmin);
    results.push({ test: "Admin Suspension", success: result.success, result });
    console.log(
      `   ${result.success ? "✅" : "❌"} ${
        result.success ? "Passed" : "Failed"
      }`
    );
  } catch (error) {
    results.push({
      test: "Admin Suspension",
      success: false,
      error: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 5: Order Confirmation
  console.log("5️⃣ Testing: Order Confirmation");
  try {
    const result = await sendOrderConfirmation(testOrder, "en");
    results.push({
      test: "Order Confirmation",
      success: result.success,
      result,
    });
    console.log(
      `   ${result.success ? "✅" : "❌"} ${
        result.success ? "Passed" : "Failed"
      }`
    );
  } catch (error) {
    results.push({
      test: "Order Confirmation",
      success: false,
      error: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 6: Order Status Update
  console.log("6️⃣ Testing: Order Status Update");
  try {
    const result = await sendOrderStatusUpdate(testOrder, "processing", "en");
    results.push({
      test: "Order Status Update",
      success: result.success,
      result,
    });
    console.log(
      `   ${result.success ? "✅" : "❌"} ${
        result.success ? "Passed" : "Failed"
      }`
    );
  } catch (error) {
    results.push({
      test: "Order Status Update",
      success: false,
      error: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 7: Shipping Notification
  console.log("7️⃣ Testing: Shipping Notification");
  try {
    const orderWithTracking = {
      ...testOrder,
      trackingNumber: "TRACK123456",
      carrier: "PostNord",
    };
    const result = await sendShippingNotification(orderWithTracking, "en");
    results.push({
      test: "Shipping Notification",
      success: result.success,
      result,
    });
    console.log(
      `   ${result.success ? "✅" : "❌"} ${
        result.success ? "Passed" : "Failed"
      }`
    );
  } catch (error) {
    results.push({
      test: "Shipping Notification",
      success: false,
      error: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 8: Payment Confirmation
  console.log("8️⃣ Testing: Payment Confirmation");
  try {
    const result = await sendPaymentConfirmation(testOrder, "en");
    results.push({
      test: "Payment Confirmation",
      success: result.success,
      result,
    });
    console.log(
      `   ${result.success ? "✅" : "❌"} ${
        result.success ? "Passed" : "Failed"
      }`
    );
  } catch (error) {
    results.push({
      test: "Payment Confirmation",
      success: false,
      error: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 9: Order Cancellation
  console.log("9️⃣ Testing: Order Cancellation");
  try {
    const result = await sendOrderCancellation(testOrder, "en");
    results.push({
      test: "Order Cancellation",
      success: result.success,
      result,
    });
    console.log(
      `   ${result.success ? "✅" : "❌"} ${
        result.success ? "Passed" : "Failed"
      }`
    );
  } catch (error) {
    results.push({
      test: "Order Cancellation",
      success: false,
      error: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 10: Admin New Order Notification
  console.log("🔟 Testing: Admin New Order Notification");
  try {
    const result = await notifyAdminNewOrder(testOrder);
    results.push({ test: "Admin New Order", success: result.success, result });
    console.log(
      `   ${result.success ? "✅" : "❌"} ${
        result.success ? "Passed" : "Failed"
      }`
    );
  } catch (error) {
    results.push({
      test: "Admin New Order",
      success: false,
      error: error.message,
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Summary\n");

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`   ✅ Passed: ${passed}/${results.length}`);
  console.log(`   ❌ Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log("\n   Failed Tests:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.test}: ${r.error || "Unknown error"}`);
      });
  }

  console.log("\n" + "=".repeat(50));
  console.log("✨ Tests Complete!\n");
};

runTests().catch(console.error);
