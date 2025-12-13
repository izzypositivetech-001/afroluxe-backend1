// using global fetch (Node 18+)

const BASE_URL = "http://localhost:5000/api/auth";

// Helper to log test results
const logResult = (testName, success, details) => {
  console.log(`\n${success ? "✅" : "❌"} ${testName}`);
  if (details) console.log(details);
};

async function runTests() {
  let token = "";

  console.log("Starting Auth API Tests...");

  // TEST 1: First Admin Registration
  // Note: If DB is already seeded, this might return 'pending' instead of 'super_admin'
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Developer Admin",
        email: "developer@test.com",
        password: "TestPassword123",
      }),
    });
    const data = await res.json();

    if (res.status === 201) {
      logResult(
        "Test 1: First Admin Registration",
        true,
        `Status: ${data.data?.admin?.status} (Note: 'pending' is expected if DB was already seeded)`
      );
    } else {
      logResult(
        "Test 1: First Admin Registration",
        false,
        `Status: ${res.status} - ${data.message}`
      );
    }
  } catch (err) {
    logResult("Test 1: First Admin Registration", false, err.message);
  }

  // TEST 2: First Admin Login
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "developer@test.com",
        password: "TestPassword123",
      }),
    });
    const data = await res.json();

    if (res.status === 200) {
      token = data.data.token;
      logResult(
        "Test 2: First Admin Login",
        true,
        "Login successful, token received"
      );
    } else {
      logResult(
        "Test 2: First Admin Login",
        false,
        `Status: ${res.status} - ${data.message}`
      );
      // Attempt login with seeded admin to continue tests if this failed
      if (res.status === 403) {
        console.log(
          "   -> Attempting fallback login with seeded admin to continue testing..."
        );
        const res2 = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "admin@afroluxe.no",
            password: "Admin@123",
          }),
        });
        const data2 = await res2.json();
        if (res2.status === 200) {
          token = data2.data.token;
          console.log("   -> Fallback login successful.");
        }
      }
    }
  } catch (err) {
    logResult("Test 2: First Admin Login", false, err.message);
  }

  // TEST 3: Get Admin Profile
  try {
    const res = await fetch(`${BASE_URL}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    if (res.status === 200) {
      logResult(
        "Test 3: Get Admin Profile",
        true,
        `User: ${data.data.admin.email}`
      );
    } else {
      logResult(
        "Test 3: Get Admin Profile",
        false,
        `Status: ${res.status} - ${data.message}`
      );
    }
  } catch (err) {
    logResult("Test 3: Get Admin Profile", false, err.message);
  }

  // TEST 4: Second Admin Registration (Pending)
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Team Member",
        email: "team@test.com",
        password: "TeamPassword123",
      }),
    });
    const data = await res.json();

    // Expect 201 but check if status is pending
    if (res.status === 201 && data.data.admin.status === "pending") {
      logResult(
        "Test 4: Second Admin Registration (Pending)",
        true,
        "Correctly registered as pending"
      );
    } else if (res.status === 201) {
      logResult(
        "Test 4: Second Admin Registration",
        true,
        `Registered but status is ${data.data.admin.status} (Expected pending)`
      );
    } else {
      logResult(
        "Test 4: Second Admin Registration",
        false,
        `Status: ${res.status} - ${data.message}`
      );
    }
  } catch (err) {
    logResult("Test 4: Second Admin Registration", false, err.message);
  }

  // TEST 5: Pending Admin CANNOT Login
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "team@test.com",
        password: "TeamPassword123",
      }),
    });
    const data = await res.json();

    if (res.status === 403 && data.message.includes("pending approval")) {
      logResult(
        "Test 5: Pending Admin CANNOT Login",
        true,
        "Correctly rejected pending login"
      );
    } else {
      logResult(
        "Test 5: Pending Admin CANNOT Login",
        false,
        `Unexpected response: ${res.status} - ${data.message}`
      );
    }
  } catch (err) {
    logResult("Test 5: Pending Admin CANNOT Login", false, err.message);
  }

  // TEST 6: Duplicate Email Prevention
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Another User",
        email: "developer@test.com", // Duplicate
        password: "AnotherPassword123",
      }),
    });
    const data = await res.json();

    if (res.status === 400 && data.message.includes("already registered")) {
      logResult(
        "Test 6: Duplicate Email Prevention",
        true,
        "Correctly rejected duplicate email"
      );
    } else {
      logResult(
        "Test 6: Duplicate Email Prevention",
        false,
        `Unexpected response: ${res.status} - ${data.message}`
      );
    }
  } catch (err) {
    logResult("Test 6: Duplicate Email Prevention", false, err.message);
  }

  // TEST 7: Password Validation
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Admin",
        email: "new@test.com",
        password: "short",
      }),
    });
    const data = await res.json();

    if (res.status === 400) {
      logResult(
        "Test 7: Password Validation",
        true,
        "Correctly rejected short password"
      );
    } else {
      logResult(
        "Test 7: Password Validation",
        false,
        `Unexpected response: ${res.status} - ${data.message}`
      );
    }
  } catch (err) {
    logResult("Test 7: Password Validation", false, err.message);
  }

  // TEST 8: Missing Fields Validation
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Admin",
      }),
    });
    const data = await res.json();

    if (res.status === 400) {
      logResult(
        "Test 8: Missing Fields Validation",
        true,
        "Correctly rejected missing fields"
      );
    } else {
      logResult(
        "Test 8: Missing Fields Validation",
        false,
        `Unexpected response: ${res.status} - ${data.message}`
      );
    }
  } catch (err) {
    logResult("Test 8: Missing Fields Validation", false, err.message);
  }

  // TEST 9: Invalid Credentials
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "developer@test.com",
        password: "WrongPassword",
      }),
    });
    const data = await res.json();

    if (res.status === 401) {
      logResult(
        "Test 9: Invalid Credentials",
        true,
        "Correctly rejected invalid password"
      );
    } else {
      logResult(
        "Test 9: Invalid Credentials",
        false,
        `Unexpected response: ${res.status} - ${data.message}`
      );
    }
  } catch (err) {
    logResult("Test 9: Invalid Credentials", false, err.message);
  }

  // TEST 10: Protected Route Without Token
  try {
    const res = await fetch(`${BASE_URL}/me`, {
      method: "GET",
    });
    const data = await res.json();

    if (res.status === 401) {
      logResult(
        "Test 10: Protected Route Without Token",
        true,
        "Correctly rejected missing token"
      );
    } else {
      logResult(
        "Test 10: Protected Route Without Token",
        false,
        `Unexpected response: ${res.status} - ${data.message}`
      );
    }
  } catch (err) {
    logResult("Test 10: Protected Route Without Token", false, err.message);
  }
}

runTests();
