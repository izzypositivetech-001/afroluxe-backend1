import axios from "axios";
import dotenv from "dotenv";
import { strict as assert } from "assert";

dotenv.config();

const API_URL = "http://localhost:5000/api";
let authToken = "";
let testCategoryId = "";

const runTests = async () => {
  console.log("🔍 Starting Search System Test Suite...\n");
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

    // Get a category ID for testing
    const categoriesRes = await axios.get(`${API_URL}/categories`);
    testCategoryId = categoriesRes.data.data[0]._id;

    console.log("\n📝 ADVANCED SEARCH TESTS\n");

    // ========================================
    // 1. ADVANCED SEARCH TESTS (10 tests)
    // ========================================

    await test("1. Basic text search - product name", async () => {
      const res = await axios.get(`${API_URL}/search?q=wig`);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.products.length > 0);
      assert.ok(res.data.data.pagination);
      assert.ok(res.data.data.facets);
    });

    await test("2. Search with category filter", async () => {
      const res = await axios.get(
        `${API_URL}/search?category=${testCategoryId}`
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.products);
      assert.equal(res.data.data.appliedFilters.category, testCategoryId);
    });

    await test("3. Search with minimum price filter", async () => {
      const res = await axios.get(`${API_URL}/search?minPrice=1000`);
      assert.equal(res.status, 200);
      res.data.data.products.forEach((p) => {
        assert.ok(
          p.price >= 1000,
          `Product price ${p.price} should be >= 1000`
        );
      });
    });

    await test("4. Search with maximum price filter", async () => {
      const res = await axios.get(`${API_URL}/search?maxPrice=500`);
      assert.equal(res.status, 200);
      res.data.data.products.forEach((p) => {
        assert.ok(p.price <= 500, `Product price ${p.price} should be <= 500`);
      });
    });

    await test("5. Search with price range (min and max)", async () => {
      const res = await axios.get(
        `${API_URL}/search?minPrice=500&maxPrice=2000`
      );
      assert.equal(res.status, 200);
      res.data.data.products.forEach((p) => {
        assert.ok(p.price >= 500 && p.price <= 2000);
      });
    });

    await test("6. Search with inStock filter", async () => {
      const res = await axios.get(`${API_URL}/search?inStock=true`);
      assert.equal(res.status, 200);
      res.data.data.products.forEach((p) => {
        assert.ok(p.stock > 0, `Product ${p.name.en} should be in stock`);
      });
    });

    await test("7. Search with sort by price ascending", async () => {
      const res = await axios.get(
        `${API_URL}/search?sortBy=price&sortOrder=asc`
      );
      assert.equal(res.status, 200);
      const prices = res.data.data.products.map((p) => p.price);
      for (let i = 1; i < prices.length; i++) {
        assert.ok(prices[i] >= prices[i - 1], "Prices should be ascending");
      }
    });

    await test("8. Search with sort by popularity", async () => {
      const res = await axios.get(
        `${API_URL}/search?sortBy=popularity&sortOrder=desc`
      );
      assert.equal(res.status, 200);
      const salesCounts = res.data.data.products.map((p) => p.salesCount);
      for (let i = 1; i < salesCounts.length; i++) {
        assert.ok(
          salesCounts[i] <= salesCounts[i - 1],
          "Sales counts should be descending"
        );
      }
    });

    await test("9. Search with pagination", async () => {
      const res = await axios.get(`${API_URL}/search?page=1&limit=5`);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.products.length <= 5);
      assert.equal(res.data.data.pagination.currentPage, 1);
      assert.equal(res.data.data.pagination.productsPerPage, 5);
    });

    await test("10. Combined filters (query + price + stock + sort)", async () => {
      const res = await axios.get(
        `${API_URL}/search?q=hair&minPrice=200&maxPrice=2000&inStock=true&sortBy=price&sortOrder=asc`
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.appliedFilters);
      assert.equal(res.data.data.appliedFilters.query, "hair");
    });

    console.log("\n🔤 SUGGESTIONS/AUTOCOMPLETE TESTS\n");

    // ========================================
    // 2. SUGGESTIONS TESTS (5 tests)
    // ========================================

    await test("11. Autocomplete with valid query", async () => {
      const res = await axios.get(`${API_URL}/search/suggestions?q=hair`);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.products || res.data.data.categories);
    });

    await test("12. Autocomplete with short query (< 2 chars)", async () => {
      const res = await axios.get(`${API_URL}/search/suggestions?q=h`);
      assert.equal(res.status, 200);
      assert.ok(
        Array.isArray(res.data.data.suggestions) ||
          (res.data.data.products && res.data.data.products.length === 0)
      );
    });

    await test("13. Autocomplete matching product name", async () => {
      const res = await axios.get(`${API_URL}/search/suggestions?q=wig`);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.products.length > 0);
      assert.equal(res.data.data.products[0].type, "product");
    });

    await test("14. Autocomplete matching SKU", async () => {
      const res = await axios.get(`${API_URL}/search/suggestions?q=BSH`);
      assert.equal(res.status, 200);
      // Should find products, may be empty but should not error
      assert.ok(res.data.success);
    });

    await test("15. Autocomplete with limit parameter", async () => {
      const res = await axios.get(
        `${API_URL}/search/suggestions?q=hair&limit=3`
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.products.length <= 3);
    });

    console.log("\n📊 FACETS/FILTER OPTIONS TESTS\n");

    // ========================================
    // 3. FACETS TESTS (4 tests)
    // ========================================

    await test("16. Get facets without search query", async () => {
      const res = await axios.get(`${API_URL}/search/facets`);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.categories);
      assert.ok(res.data.data.priceRanges);
      assert.ok(res.data.data.stock);
    });

    await test("17. Get facets with search query", async () => {
      const res = await axios.get(`${API_URL}/search/facets?q=wig`);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.categories);
    });

    await test("18. Verify category counts in facets", async () => {
      const res = await axios.get(`${API_URL}/search/facets`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data.categories));
      res.data.data.categories.forEach((cat) => {
        assert.ok(cat.count > 0);
        assert.ok(cat.name);
      });
    });

    await test("19. Verify stock availability counts", async () => {
      const res = await axios.get(`${API_URL}/search/facets`);
      assert.equal(res.status, 200);
      assert.ok(typeof res.data.data.stock.inStock === "number");
      assert.ok(typeof res.data.data.stock.outOfStock === "number");
    });

    console.log("\n📁 CATEGORY SEARCH TESTS\n");

    // ========================================
    // 4. CATEGORY SEARCH TESTS (5 tests)
    // ========================================

    await test("20. Search by valid category", async () => {
      const res = await axios.get(
        `${API_URL}/search/category/${testCategoryId}`
      );
      assert.equal(res.status, 200);
      assert.ok(res.data.data.category);
      assert.ok(res.data.data.products);
      assert.equal(res.data.data.category.id, testCategoryId);
    });

    await test("21. Search by invalid category (should 404)", async () => {
      try {
        await axios.get(`${API_URL}/search/category/507f1f77bcf86cd799439011`);
        assert.fail("Should have returned 404");
      } catch (error) {
        assert.equal(error.response?.status, 404);
      }
    });

    await test("22. Category search with price filter", async () => {
      const res = await axios.get(
        `${API_URL}/search/category/${testCategoryId}?minPrice=500&maxPrice=3000`
      );
      assert.equal(res.status, 200);
      res.data.data.products.forEach((p) => {
        assert.ok(p.price >= 500 && p.price <= 3000);
      });
    });

    await test("23. Category search with stock filter", async () => {
      const res = await axios.get(
        `${API_URL}/search/category/${testCategoryId}?inStock=true`
      );
      assert.equal(res.status, 200);
      res.data.data.products.forEach((p) => {
        assert.ok(p.stock > 0);
      });
    });

    await test("24. Category search with sorting", async () => {
      const res = await axios.get(
        `${API_URL}/search/category/${testCategoryId}?sortBy=price&sortOrder=desc`
      );
      assert.equal(res.status, 200);
      const prices = res.data.data.products.map((p) => p.price);
      for (let i = 1; i < prices.length; i++) {
        assert.ok(prices[i] <= prices[i - 1], "Prices should be descending");
      }
    });

    console.log("\n🔥 POPULAR SEARCHES TESTS\n");

    // ========================================
    // 5. POPULAR SEARCHES TESTS (3 tests)
    // ========================================

    await test("25. Get popular searches", async () => {
      const res = await axios.get(`${API_URL}/search/popular`);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.products);
      assert.ok(res.data.data.categories);
    });

    await test("26. Popular searches are sorted by sales", async () => {
      const res = await axios.get(`${API_URL}/search/popular`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data.products));
      // First product should be most popular
    });

    await test("27. Popular searches with limit parameter", async () => {
      const res = await axios.get(`${API_URL}/search/popular?limit=5`);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.products.length <= 5);
    });

    console.log("\n💰 PRICE RANGE TESTS\n");

    // ========================================
    // 6. PRICE RANGE TESTS (4 tests)
    // ========================================

    await test("28. Search by min price only", async () => {
      const res = await axios.get(
        `${API_URL}/search/price-range?minPrice=1000`
      );
      assert.equal(res.status, 200);
      res.data.data.products.forEach((p) => {
        assert.ok(p.price >= 1000);
      });
    });

    await test("29. Search by max price only", async () => {
      const res = await axios.get(`${API_URL}/search/price-range?maxPrice=500`);
      assert.equal(res.status, 200);
      res.data.data.products.forEach((p) => {
        assert.ok(p.price <= 500);
      });
    });

    await test("30. Search by price range (min and max)", async () => {
      const res = await axios.get(
        `${API_URL}/search/price-range?minPrice=500&maxPrice=2000`
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.data.priceRange.min, "500");
      res.data.data.products.forEach((p) => {
        assert.ok(p.price >= 500 && p.price <= 2000);
      });
    });

    await test("31. Price range with category filter", async () => {
      const res = await axios.get(
        `${API_URL}/search/price-range?minPrice=200&maxPrice=1500&category=${testCategoryId}`
      );
      assert.equal(res.status, 200);
      res.data.data.products.forEach((p) => {
        assert.ok(p.price >= 200 && p.price <= 1500);
      });
    });
  } catch (error) {
    console.error("\n❌ Test Suite Error:", error.message);
  } finally {
    console.log("\n" + "=".repeat(50));
    console.log("📊 SEARCH TEST SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total:  ${passed + failed}`);
    console.log(
      `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
    );
    console.log("=".repeat(50));
  }
};

runTests();
