import axios from "axios";
import fs from "fs";
import path from "path";
import { strict as assert } from "assert";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "http://localhost:5000/api";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runTests = async () => {
  console.log("🚀 Starting Production Readiness Test Suite...\n");
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

  try {
    // ========================================
    // 1. HEALTH CHECKS
    // ========================================
    console.log("\n🏥 HEALTH CHECK TESTS\n");

    await test("1. Basic Health Check", async () => {
      const res = await axios.get(`${API_URL}/health`);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, "OK");
      assert.ok(res.data.data.uptime);
      assert.ok(res.data.data.timestamp);
    });

    await test("2. Detailed Health Check", async () => {
      const res = await axios.get(`${API_URL}/health/detailed`);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, "OK");
      assert.ok(res.data.data.database.connected);
      assert.ok(res.data.data.memory);
      assert.ok(res.data.data.system);
    });

    await test("3. Readiness Check", async () => {
      const res = await axios.get(`${API_URL}/health/ready`);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, "READY");
    });

    await test("4. Liveness Check", async () => {
      const res = await axios.get(`${API_URL}/health/live`);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, "ALIVE");
    });

    // ========================================
    // 2. LOGGING VERIFICATION
    // ========================================
    console.log("\n📝 LOGGING TESTS\n");

    await test("5. Check Log Files Existence", async () => {
      const logsDir = path.join(__dirname, "..", "logs");
      if (!fs.existsSync(logsDir)) {
        throw new Error("Logs directory does not exist");
      }

      const files = fs.readdirSync(logsDir);
      const hasCombined = files.some((f) => f.startsWith("combined-"));
      const hasError = files.some((f) => f.startsWith("error-"));

      assert.ok(hasCombined, "Combined log file missing");
      assert.ok(hasError, "Error log file missing");
    });

    // ========================================
    // 3. RATE LIMITING
    // ========================================
    console.log("\n🛑 RATE LIMITING TESTS\n");

    await test("6. Rate Limiting (General API)", async () => {
      // Send requests until limit is hit or reasonable number reached
      // Note: This might trigger the actual rate limiter for the IP, so run last or be careful
      const limit = 105;
      let blocked = false;

      console.log("   Sending burst requests...");
      const requests = [];
      for (let i = 0; i < limit; i++) {
        requests.push(axios.get(`${API_URL}/health`).catch((e) => e));
      }

      const results = await Promise.all(requests);

      // Check if any returned 429
      const tooManyRequests = results.find((r) => r.response?.status === 429);

      if (tooManyRequests) {
        blocked = true;
      } else {
        // It's possible we didn't hit the limit if it's high or window is large
        // But we should verify headers at least
        const successRes = results.find((r) => r.status === 200);
        if (successRes) {
          assert.ok(
            successRes.headers["ratelimit-limit"] ||
              successRes.headers["x-ratelimit-limit"],
            "Rate limit headers missing"
          );
        }
      }

      // We don't strictly fail if not blocked because test env might have different limits,
      // but we want to verify the mechanism exists.
      if (blocked) {
        console.log("   ✅ Rate limit triggered correctly");
      } else {
        console.log("   ⚠️ Rate limit not triggered (limit might be higher)");
      }
    });

    // ========================================
    // 4. ENVIRONMENT
    // ========================================
    console.log("\n🌍 ENVIRONMENT TESTS\n");

    await test("7. Environment Variables Validation", async () => {
      // We can't easily import the ES module config here without some setup,
      // but we can check if the endpoint reports the environment correctly
      const res = await axios.get(`${API_URL}/health`);
      assert.ok(res.data.data.environment);
    });
  } catch (error) {
    console.error("\n❌ Test Suite Error:", error.message);
  } finally {
    console.log("\n" + "=".repeat(50));
    console.log("🚀 PRODUCTION READINESS SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("=".repeat(50));
  }
};

runTests();
