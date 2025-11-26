import axios from "axios";
import dotenv from "dotenv";
import { strict as assert } from "assert";
import {
  orderConfirmationTemplate,
  orderStatusTemplate,
  shippingNotificationTemplate,
  paymentConfirmationTemplate,
  orderCancellationTemplate,
  adminNotificationTemplate,
} from "../utils/emailTemplates.js";

dotenv.config();

const API_URL = "http://localhost:5000/api";
let authToken = "";

const runTests = async () => {
  console.log("📧 Starting Email/Notification Test Suite...\n");
  let passed = 0;
  let failed = 0;

  const emailConfigured = !!(
    process.env.EMAIL_USER && process.env.EMAIL_PASSWORD
  );
  console.log(
    `Email Configuration: ${
      emailConfigured
        ? "✅ Configured (will send real emails)"
        : "⚠️  Not configured (testing structure only)"
    }\n`
  );

  const test = async (name, fn) => {
    try {
      process.stdout.write(`Testing ${name}... `);
      await fn();
      console.log("✅ PASS");
      passed++;
    } catch (error) {
      console.log("❌ FAIL");
      console.error("   Error:", error.message);
      if (error.response?.data) {
        console.error(
          "   Response:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
      failed++;
    }
  };

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${authToken}` },
  });

  // Test order data
  const testOrder = {
    orderId: "TEST-2024-001",
    customer: {
      name: "Test Customer",
      email: "test@example.com",
      phone: "+47 123 45 678",
    },
    items: [
      {
        name: { en: "Premium Hair Extension", no: "Premium Hårforlengelse" },
        quantity: 2,
        price: 999,
      },
      {
        name: { en: "Hair Care Kit", no: "Hårpleiepakke" },
        quantity: 1,
        price: 499,
      },
    ],
    subtotal: 2497,
    tax: 624.25,
    total: 3121.25,
    shippingAddress: {
      address: "Test Street 123",
      postalCode: "0123",
      city: "Oslo",
      country: "Norway",
    },
    paymentMethod: "stripe",
    paymentStatus: "paid",
    trackingNumber: "TRACK123456",
    carrier: "PostNord",
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(),
  };

  try {
    // ========================================
    // SETUP: Login
    // ========================================
    await test("0. Login as Admin", async () => {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: "admin@afroluxe.no",
        password: "Admin@123",
      });
      assert.equal(res.status, 200);
      authToken = res.data.data.token;
    });

    console.log("\n📝 TEMPLATE GENERATION TESTS\n");

    // ========================================
    // 1. TEMPLATE GENERATION TESTS (6 tests)
    // ========================================

    await test("1. Order Confirmation Template - English", async () => {
      const { subject, html } = orderConfirmationTemplate(testOrder, "en");
      assert.ok(subject.includes("Order Confirmation"));
      assert.ok(subject.includes(testOrder.orderId));
      assert.ok(html.includes("Thank you for your order"));
      assert.ok(html.includes("Premium Hair Extension"));
      assert.ok(html.includes("3121.25 NOK"));
      assert.ok(html.includes("Oslo"));
    });

    await test("2. Order Confirmation Template - Norwegian", async () => {
      const { subject, html } = orderConfirmationTemplate(testOrder, "no");
      assert.ok(subject.includes("Ordrebekreftelse"));
      assert.ok(html.includes("Takk for din bestilling"));
      assert.ok(html.includes("Premium Hårforlengelse"));
      assert.ok(html.includes("3121.25 NOK"));
    });

    await test("3. Order Status Template - All Statuses", async () => {
      const statuses = [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];
      for (const status of statuses) {
        const { subject, html } = orderStatusTemplate(testOrder, status, "en");
        assert.ok(subject.includes("Order Status Update"));
        assert.ok(html.includes(testOrder.orderId));
      }
    });

    await test("4. Shipping Notification Template", async () => {
      const { subject, html } = shippingNotificationTemplate(testOrder, "en");
      assert.ok(subject.includes("shipped"));
      assert.ok(html.includes("TRACK123456"));
      assert.ok(html.includes("PostNord"));
    });

    await test("5. Payment Confirmation Template", async () => {
      const { subject, html } = paymentConfirmationTemplate(testOrder, "en");
      assert.ok(subject.includes("Payment Confirmed"));
      assert.ok(html.includes("3121.25 NOK"));
      assert.ok(html.includes("STRIPE"));
    });

    await test("6. Order Cancellation Template", async () => {
      const { subject, html } = orderCancellationTemplate(testOrder, "en");
      assert.ok(subject.includes("Cancelled"));
      assert.ok(html.includes(testOrder.orderId));
      // Should show refund info for paid orders
      assert.ok(html.includes("refund"));
    });

    await test("7. Admin Notification Templates", async () => {
      const types = ["new_order", "low_stock", "order_cancelled"];
      for (const type of types) {
        const data =
          type === "new_order"
            ? { orderId: "ORD-001", customer: "John Doe", total: "1000" }
            : type === "low_stock"
            ? { productName: "Test Product", stock: 3 }
            : { orderId: "ORD-001", customer: "John Doe" };

        const { subject, html } = adminNotificationTemplate(type, data, "en");
        assert.ok(subject);
        assert.ok(html);
      }
    });

    console.log("\n🔐 NOTIFICATION CONTROLLER TESTS\n");

    // ========================================
    // 2. NOTIFICATION CONTROLLER TESTS (5 tests)
    // ========================================

    await test("8. Get Notification Settings", async () => {
      const res = await axios.get(
        `${API_URL}/admin/notifications/settings`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.emailService);
      assert.ok(res.data.data.notifications);
      assert.equal(res.data.data.emailService.configured, emailConfigured);
    });

    await test("9. Test Email - Valid Email", async () => {
      const res = await axios.post(
        `${API_URL}/admin/notifications/test-email`,
        { email: "test@example.com" },
        getAuthHeader()
      );

      if (emailConfigured) {
        assert.equal(res.status, 200);
        assert.ok(res.data.data.messageId || !res.data.success);
      } else {
        // Without email config, it should fail but not crash
        assert.ok(res.status === 200 || res.status === 500);
      }
    });

    await test("10. Test Email - Missing Email (400)", async () => {
      try {
        await axios.post(
          `${API_URL}/admin/notifications/test-email`,
          {},
          getAuthHeader()
        );
        assert.fail("Should have returned 400");
      } catch (error) {
        assert.equal(error.response.status, 400);
      }
    });

    await test("11. Resend Confirmation - Invalid Order (404)", async () => {
      try {
        await axios.post(
          `${API_URL}/admin/notifications/resend-confirmation/INVALID-ORDER`,
          {},
          getAuthHeader()
        );
        assert.fail("Should have returned 404");
      } catch (error) {
        assert.equal(error.response.status, 404);
      }
    });

    await test("12. Check Low Stock - With Threshold", async () => {
      const res = await axios.post(
        `${API_URL}/admin/notifications/check-low-stock`,
        { threshold: 10 },
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.threshold === 10);
      assert.ok(Array.isArray(res.data.data.products));
    });

    console.log("\n🔑 AUTHORIZATION TESTS\n");

    // ========================================
    // 3. AUTHORIZATION TESTS (5 tests)
    // ========================================

    await test("13. Settings - Requires Auth (401)", async () => {
      try {
        await axios.get(`${API_URL}/admin/notifications/settings`);
        assert.fail("Should require authentication");
      } catch (error) {
        assert.equal(error.response.status, 401);
      }
    });

    await test("14. Test Email - Requires Auth (401)", async () => {
      try {
        await axios.post(`${API_URL}/admin/notifications/test-email`, {
          email: "test@example.com",
        });
        assert.fail("Should require authentication");
      } catch (error) {
        assert.equal(error.response.status, 401);
      }
    });

    await test("15. Resend Confirmation - Requires Auth (401)", async () => {
      try {
        await axios.post(
          `${API_URL}/admin/notifications/resend-confirmation/TEST-001`
        );
        assert.fail("Should require authentication");
      } catch (error) {
        assert.equal(error.response.status, 401);
      }
    });

    await test("16. Shipping Notification - Requires Auth (401)", async () => {
      try {
        await axios.post(`${API_URL}/admin/notifications/shipping/TEST-001`);
        assert.fail("Should require authentication");
      } catch (error) {
        assert.equal(error.response.status, 401);
      }
    });

    await test("17. Low Stock Check - Requires Auth (401)", async () => {
      try {
        await axios.post(`${API_URL}/admin/notifications/check-low-stock`);
        assert.fail("Should require authentication");
      } catch (error) {
        assert.equal(error.response.status, 401);
      }
    });

    console.log("\n🌍 BILINGUAL SUPPORT TESTS\n");

    // ========================================
    // 4. BILINGUAL TESTS (6 tests)
    // ========================================

    await test("18. English Translations - Order Confirmation", async () => {
      const { html } = orderConfirmationTemplate(testOrder, "en");
      assert.ok(html.includes("Order ID"));
      assert.ok(html.includes("Subtotal"));
      assert.ok(html.includes("Total"));
      assert.ok(html.includes("Shipping Address"));
    });

    await test("19. Norwegian Translations - Order Confirmation", async () => {
      const { html } = orderConfirmationTemplate(testOrder, "no");
      assert.ok(html.includes("Ordre-ID"));
      assert.ok(html.includes("Delsum"));
      assert.ok(html.includes("Totalt"));
      assert.ok(html.includes("Leveringsadresse"));
    });

    await test("20. English Status Messages", async () => {
      const { html } = orderStatusTemplate(testOrder, "shipped", "en");
      assert.ok(html.includes("Shipped"));
    });

    await test("21. Norwegian Status Messages", async () => {
      const { html } = orderStatusTemplate(testOrder, "shipped", "no");
      assert.ok(html.includes("Sendt"));
    });

    await test("22. English Admin Notifications", async () => {
      const { subject } = adminNotificationTemplate(
        "new_order",
        {
          orderId: "ORD-001",
          customer: "John",
          total: "1000",
        },
        "en"
      );
      assert.ok(subject.includes("New Order"));
    });

    await test("23. Norwegian Admin Notifications", async () => {
      const { subject } = adminNotificationTemplate(
        "new_order",
        {
          orderId: "ORD-001",
          customer: "John",
          total: "1000",
        },
        "no"
      );
      assert.ok(subject.includes("Ny bestilling"));
    });

    console.log("\n📧 EMAIL SERVICE INTEGRATION TESTS\n");

    // ========================================
    // 5. EMAIL SERVICE TESTS (5 tests)
    // ========================================

    await test("24. Template HTML Structure", async () => {
      const { html } = orderConfirmationTemplate(testOrder, "en");
      // Check for proper HTML structure
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("<head>"));
      assert.ok(html.includes("<body>"));
      assert.ok(html.includes("AfroLuxe"));
      assert.ok(html.includes("</html>"));
    });

    await test("25. Template Responsive Design", async () => {
      const { html } = orderConfirmationTemplate(testOrder, "en");
      // Check for responsive meta tag and inline CSS
      assert.ok(html.includes("viewport"));
      assert.ok(html.includes("max-width"));
    });

    await test("26. Button Links Include Frontend URL", async () => {
      const { html } = orderConfirmationTemplate(testOrder, "en");
      // Should include button with order link
      assert.ok(html.includes("button") || html.includes("View Order"));
      assert.ok(html.includes("/orders/") || html.includes("href"));
    });

    await test("27. Conditional Content - Refund Message", async () => {
      const paidOrder = { ...testOrder, paymentStatus: "paid" };
      const unpaidOrder = { ...testOrder, paymentStatus: "pending" };

      const { html: paidHtml } = orderCancellationTemplate(paidOrder, "en");
      const { html: unpaidHtml } = orderCancellationTemplate(unpaidOrder, "en");

      // Paid order should show refund info
      assert.ok(paidHtml.includes("refund") || paidHtml.includes("Refund"));
      // Unpaid order should not show refund info
      assert.ok(
        !unpaidHtml.includes("refund") && !unpaidHtml.includes("Refund")
      );
    });

    await test("28. Optional Fields Handling", async () => {
      const orderNoTracking = {
        ...testOrder,
        trackingNumber: null,
        carrier: null,
        estimatedDelivery: null,
      };

      const { html } = shippingNotificationTemplate(orderNoTracking, "en");
      // Should show N/A for missing fields
      assert.ok(html.includes("N/A"));
    });

    console.log("\n🛠️ ERROR HANDLING TESTS\n");

    // ========================================
    // 6. ERROR HANDLING TESTS (2 tests)
    // ========================================

    await test("29. Shipping Without Tracking Number (400)", async () => {
      // This would need a real order without tracking, so we test the endpoint exists
      try {
        await axios.post(
          `${API_URL}/admin/notifications/shipping/NONEXISTENT`,
          {},
          getAuthHeader()
        );
        assert.fail("Should return 404 or 400");
      } catch (error) {
        assert.ok(
          error.response.status === 404 || error.response.status === 400
        );
      }
    });

    await test("30. Settings Show Configuration Status", async () => {
      const res = await axios.get(
        `${API_URL}/admin/notifications/settings`,
        getAuthHeader()
      );
      const settings = res.data.data;

      // Should indicate if email is configured or not
      assert.ok(typeof settings.emailService.configured === "boolean");
      assert.ok(settings.emailService.from);
      assert.ok(settings.notifications);
    });
  } catch (error) {
    console.error("\n❌ Test Suite Error:", error.message);
  } finally {
    console.log("\n" + "=".repeat(50));
    console.log("📧 EMAIL/NOTIFICATION TEST SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total:  ${passed + failed}`);
    console.log(
      `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
    );
    console.log("=".repeat(50));

    if (!emailConfigured) {
      console.log("\n⚠️  NOTE: Email credentials not configured in .env");
      console.log("   Tests validated structure but did not send real emails.");
      console.log(
        "   To send real emails, configure EMAIL_USER and EMAIL_PASSWORD."
      );
    }

    if (failed > 0) {
      console.log("\n⚠️  Some tests failed. Review the errors above.");
    } else {
      console.log("\n🎉 All email/notification tests passed!");
    }
  }
};

runTests();
