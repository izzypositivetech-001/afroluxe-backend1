import axios from "axios";
import dotenv from "dotenv";
import { strict as assert } from "assert";

dotenv.config();

const API_URL = "http://localhost:5000/api";
let authToken = "";

const runTests = async () => {
  console.log("🚀 Starting Analytics Test Suite...");
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
      if (error.response) {
        console.error("   Response:", error.response.data);
      }
      failed++;
    }
  };

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${authToken}` },
  });

  try {
    // 1. Login
    await test("1. Login as Admin", async () => {
      try {
        const res = await axios.post(`${API_URL}/auth/login`, {
          email: "admin@afroluxe.no",
          password: "Admin@123",
        });
        assert.equal(res.status, 200);
        assert.ok(res.data.success);
        assert.ok(res.data.data.token);
        authToken = res.data.data.token;
      } catch (e) {
        console.error("Login Failed Response:", e.response?.data);
        throw e;
      }
    });

    // 2. Dashboard Overview
    await test("2. Get Dashboard Overview", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/dashboard`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      const data = res.data.data;

      assert.ok(data.revenue);
      assert.ok(data.orders);
      assert.ok(data.customers);
      assert.ok(data.products);

      // Verify Metrics based on Seed
      // We expect some revenue and orders
      assert.ok(data.revenue.total > 0, "Total revenue should be > 0");
      assert.ok(data.orders.total > 0, "Total orders should be > 0");
      assert.equal(data.products.total, 4, "Should have 4 products");
      assert.equal(
        data.products.lowStock,
        1,
        "Should have 1 low stock product"
      );
      assert.equal(
        data.products.outOfStock,
        1,
        "Should have 1 out of stock product"
      );
    });

    // 3. Revenue Analytics - Daily
    await test("3. Revenue Analytics - Daily", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/revenue?groupBy=day`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      const data = res.data.data;
      assert.ok(data.summary);
      assert.ok(data.revenueOverTime);
      assert.ok(Array.isArray(data.revenueOverTime));
    });

    // 4. Revenue Analytics - Weekly
    await test("4. Revenue Analytics - Weekly", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/revenue?groupBy=week`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      const data = res.data.data;
      if (data.revenueOverTime.length > 0) {
        assert.ok(
          data.revenueOverTime[0]._id.week,
          "Should be grouped by week"
        );
      }
    });

    // 5. Revenue Analytics - Monthly
    await test("5. Revenue Analytics - Monthly", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/revenue?groupBy=month`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      const data = res.data.data;
      if (data.revenueOverTime.length > 0) {
        assert.ok(
          data.revenueOverTime[0]._id.month,
          "Should be grouped by month"
        );
      }
    });

    // 6. Revenue Analytics - Date Range
    await test("6. Revenue Analytics - With Date Range", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/revenue?groupBy=month&startDate=2024-01-01&endDate=2024-12-31`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      const data = res.data.data;
      assert.ok(data.revenueByPaymentMethod);
    });

    // 7. Product Analytics - All
    await test("7. Product Analytics - All Metrics", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/products`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      const data = res.data.data;
      assert.ok(data.topSellingProducts);
      assert.ok(data.topRevenueProducts);
      assert.ok(data.productsByCategory);
      assert.ok(data.lowStockProducts);
      assert.ok(data.outOfStockProducts);

      // Verify Seed Data
      assert.equal(data.lowStockProducts.length, 1);
      assert.equal(data.outOfStockProducts.length, 1);
    });

    // 8. Product Analytics - Limit
    await test("8. Product Analytics - Top 5", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/products?limit=5`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.topSellingProducts.length <= 5);
    });

    // 9. Product Analytics - Date Range
    await test("9. Product Analytics - With Date Range", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/products?startDate=2024-01-01&endDate=2024-12-31`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
    });

    // 10. Customer Analytics - All
    await test("10. Customer Analytics - All Metrics", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/customers`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      const data = res.data.data;
      assert.ok(data.topCustomers);
      assert.ok(data.customersByOrderCount);
      assert.ok(data.newVsReturning);
      assert.ok(data.customerLTV);
    });

    // 11. Customer Analytics - Limit
    await test("11. Customer Analytics - Top 20", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/customers?limit=20`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.topCustomers.length <= 20);
    });

    // 12. Sales Trends - Week
    await test("12. Sales Trends - Last Week", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/trends?period=week`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      const data = res.data.data;
      assert.equal(data.period, "week");
      assert.ok(data.salesTrend);
    });

    // 13. Sales Trends - Month
    await test("13. Sales Trends - Last Month", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/trends?period=month`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.data.period, "month");
    });

    // 14. Sales Trends - Quarter
    await test("14. Sales Trends - Last Quarter", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/trends?period=quarter`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.data.period, "quarter");
    });

    // 15. Sales Trends - Year
    await test("15. Sales Trends - Last Year", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/trends?period=year`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.data.period, "year");
    });

    // 16. Export - CSV
    await test("16. Export Report - CSV", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/export?format=csv`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.ok(res.headers["content-type"].includes("text/csv"));
      assert.ok(res.data.includes("Order ID"));
    });

    // 17. Export - JSON
    await test("17. Export Report - JSON", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/export?format=json`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.orders);
    });

    // 18. Export - CSV Date Range
    await test("18. Export Report - CSV with Date Range", async () => {
      const res = await axios.get(
        `${API_URL}/admin/analytics/export?format=csv&startDate=2024-01-01&endDate=2024-12-31`,
        getAuthHeader()
      );
      assert.equal(res.status, 200);
      assert.ok(res.headers["content-type"].includes("text/csv"));
    });

    // 19-24. Auth Tests
    const endpoints = [
      "dashboard",
      "revenue",
      "products",
      "customers",
      "trends",
      "export",
    ];

    for (const endpoint of endpoints) {
      await test(`Auth Test - ${endpoint}`, async () => {
        try {
          await axios.get(`${API_URL}/admin/analytics/${endpoint}`);
          throw new Error("Should have failed with 401");
        } catch (error) {
          assert.equal(error.response?.status, 401);
        }
      });
    }
  } catch (error) {
    console.error("Test Suite Error:", error);
  } finally {
    console.log("\n📊 Test Summary");
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);
  }
};

runTests();
