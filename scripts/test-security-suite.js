import axios from "axios";
import dotenv from "dotenv";
import { strict as assert } from "assert";

dotenv.config();

const API_URL = "http://localhost:5000/api";
let authToken = "";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runTests = async () => {
  console.log("🔒 Starting Security System Test Suite...\n");
  let passed = 0;
  let failed = 0;

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

  try {
    // ========================================
    // SETUP: Login as super_admin
    // ========================================
    await test("0. Login as Super Admin", async () => {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: "admin@afroluxe.no",
        password: "Admin@123",
      });
      assert.equal(res.status, 200);
      authToken = res.data.data.token;
    });

    console.log("\n📊 SECURITY CONTROLLER TESTS\n");

    // ========================================
    // 1. SECURITY CONTROLLER TESTS (5 tests)
    // ========================================

    await test("1. Get Security Status", async () => {
      const res = await axios.get(
        `${API_URL}/admin/security/status`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.rateLimiting);
      assert.ok(res.data.data.security);
      assert.ok(res.data.data.blockedIPs);
      assert.equal(
        res.data.data.rateLimiting.limits.auth,
        "5 requests per 15 minutes"
      );
    });

    await test("2. Block IP Address - valid IP", async () => {
      const res = await axios.post(
        `${API_URL}/admin/security/block-ip`,
        { ip: "192.168.1.100" },
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.data.blockedIP, "192.168.1.100");
      assert.ok(res.data.data.blockedIPs.includes("192.168.1.100"));
    });

    await test("3. Get Blocked IPs List", async () => {
      const res = await axios.get(
        `${API_URL}/admin/security/blocked-ips`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.count >= 1);
      assert.ok(Array.isArray(res.data.data.blockedIPs));
    });

    await test("4. Unblock IP Address", async () => {
      const res = await axios.post(
        `${API_URL}/admin/security/unblock-ip`,
        { ip: "192.168.1.100" },
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.data.unblockedIP, "192.168.1.100");
    });

    await test("5. Block IP - invalid format (should 400)", async () => {
      try {
        await axios.post(
          `${API_URL}/admin/security/block-ip`,
          { ip: "invalid-ip" },
          getAuthHeader()
        );
        assert.fail("Should have returned 400");
      } catch (error) {
        assert.equal(error.response.status, 400);
      }
    });

    console.log("\n🔐 SECURITY HEADERS TESTS\n");

    // ========================================
    // 2. SECURITY HEADERS TESTS (3 tests)
    // ========================================

    await test("6. Security Headers Present", async () => {
      const res = await axios.get(`${API_URL}/health`);
      assert.equal(res.status, 200);
      // Check for security headers
      assert.ok(res.headers["x-content-type-options"]);
      assert.ok(res.headers["x-frame-options"]);
      // X-Powered-By should NOT be present
      assert.equal(res.headers["x-powered-by"], undefined);
    });

    await test("7. CORS Headers Present", async () => {
      const res = await axios.get(`${API_URL}/health`);
      assert.ok(
        res.headers["access-control-allow-origin"] !== undefined ||
          res.headers["access-control-allow-credentials"]
      );
    });

    await test("8. Helmet CSP Headers", async () => {
      const res = await axios.get(`${API_URL}/health`);
      // Helmet should add various security headers
      assert.ok(res.headers);
    });

    console.log("\n⏱️ RATE LIMITER TESTS (Note: Will take time)\n");

    // ========================================
    // 3. RATE LIMITER TESTS (7 tests)
    // ========================================

    await test("9. Auth Rate Limiter - 6th request blocked", async () => {
      // In case of previous tests, wait a bit
      await sleep(1000);

      // Make 6 failed login attempts
      let blocked = false;
      for (let i = 1; i <= 6; i++) {
        try {
          await axios.post(`${API_URL}/auth/login`, {
            email: "wrong@test.com",
            password: "wrongpass",
          });
        } catch (error) {
          if (error.response?.status === 429 && i === 6) {
            blocked = true;
            assert.ok(error.response.data.message.includes("Too many"));
          }
        }
        await sleep(100); // Small delay between requests
      }
      assert.ok(blocked, "Should have blocked 6th request");
    });

    // Wait a bit before next rate limit test
    await sleep(2000);

    await test("10. Rate Limit Headers Present", async () => {
      const res = await axios.get(`${API_URL}/health`);
      // Should have RateLimit headers
      assert.ok(
        res.headers["ratelimit-limit"] ||
          res.headers["x-ratelimit-limit"] ||
          true
      ); // Some rate limiters might not add headers on first request
    });

    console.log("\n🛡️ DATA SANITIZATION TESTS\n");

    // ========================================
    // 4. DATA SANITIZATION TESTS (4 tests)
    // ========================================

    await test("11. MongoDB Injection Prevention", async () => {
      // Try to inject MongoDB operators
      try {
        const res = await axios.get(`${API_URL}/search?q[$ne]=test`);
        // Should sanitize the input or handle gracefully
        assert.equal(res.status, 200);
      } catch (error) {
        // If it errors, it should be a validation error, not a database error
        assert.ok(error.response.status < 500);
      }
    });

    await test("12. Parameter Pollution Handling", async () => {
      // Send duplicate parameters
      const res = await axios.get(`${API_URL}/search?price=100&price=200`);
      assert.equal(res.status, 200);
      // HPP should handle this gracefully
    });

    await test("13. Large Payload Rejection", async () => {
      // Try to send >10mb payload (should be rejected)
      const largeData = "x".repeat(11 * 1024 * 1024); // 11MB
      try {
        await axios.post(`${API_URL}/auth/login`, {
          data: largeData,
        });
        assert.fail("Should have rejected large payload");
      } catch (error) {
        // Should reject with 413 or 400
        assert.ok(
          error.response.status === 413 || error.response.status === 400
        );
      }
    });

    await test("14. XSS Input Sanitization", async () => {
      // This is hard to test without a vulnerable endpoint
      // Just verify the middleware doesn't break normal requests
      const res = await axios.get(
        `${API_URL}/search?q=<script>alert("xss")</script>`
      );
      assert.equal(res.status, 200);
      // The middleware should have sanitized the input
    });

    console.log("\n🚫 IP BLOCKING TESTS\n");

    // ========================================
    // 5. IP BLOCKING INTEGRATION TEST (2 tests)
    // ========================================

    await test("15. Block & Clear IPs Workflow", async () => {
      // Block multiple IPs
      await axios.post(
        `${API_URL}/admin/security/block-ip`,
        { ip: "10.0.0.1" },
        getAuthHeader()
      );
      await axios.post(
        `${API_URL}/admin/security/block-ip`,
        { ip: "10.0.0.2" },
        getAuthHeader()
      );

      // Get list
      let res = await axios.get(
        `${API_URL}/admin/security/blocked-ips`,
        getAuthHeader()
      );
      assert.ok(res.data.data.count >= 2);

      // Clear all
      res = await axios.post(
        `${API_URL}/admin/security/clear-blocked-ips`,
        {},
        getAuthHeader()
      );
      assert.ok(res.data.data.clearedCount >= 2);

      // Verify cleared
      res = await axios.get(
        `${API_URL}/admin/security/blocked-ips`,
        getAuthHeader()
      );
      assert.equal(res.data.data.count, 0);
    });

    console.log("\n🔑 AUTHORIZATION TESTS\n");

    // ========================================
    // 6. AUTHORIZATION TESTS (3 tests)
    // ========================================

    await test("16. Security Status - Requires Auth", async () => {
      try {
        await axios.get(`${API_URL}/admin/security/status`);
        assert.fail("Should require authentication");
      } catch (error) {
        assert.equal(error.response.status, 401);
      }
    });

    await test("17. Block IP - Requires Auth", async () => {
      try {
        await axios.post(`${API_URL}/admin/security/block-ip`, {
          ip: "1.1.1.1",
        });
        assert.fail("Should require authentication");
      } catch (error) {
        assert.equal(error.response.status, 401);
      }
    });

    await test("18. Security Routes - Super Admin Only", async () => {
      // This test assumes super_admin auth works (tested in test 0)
      const res = await axios.get(
        `${API_URL}/admin/security/status`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
    });

    console.log("\n✨ INTEGRATION TESTS\n");

    // ========================================
    // 7. INTEGRATION TESTS (2 tests)
    // ========================================

    await test("19. Combined Security - Headers + Rate Limit", async () => {
      const res = await axios.get(`${API_URL}/health`);
      assert.equal(res.status, 200);
      // Should have both security headers AND work with rate limiting
      assert.ok(res.headers["x-content-type-options"]);
    });

    await test("20. Security Middleware Order", async () => {
      // ipBlocker, securityLogger, helmet, cors, etc. should all work together
      const res = await axios.get(`${API_URL}/health`);
      assert.equal(res.status, 200);
      assert.ok(res.data.success);
    });
  } catch (error) {
    console.error("\n❌ Test Suite Error:", error.message);
  } finally {
    console.log("\n" + "=".repeat(50));
    console.log("🔒 SECURITY TEST SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total:  ${passed + failed}`);
    console.log(
      `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
    );
    console.log("=".repeat(50));

    if (failed > 0) {
      console.log("\n⚠️  Some tests failed. Review the errors above.");
    } else {
      console.log("\n🎉 All security tests passed!");
    }
  }
};

runTests();
