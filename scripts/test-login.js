import axios from "axios";

const testLogin = async () => {
  try {
    console.log("Testing login...");
    const response = await axios.post("http://localhost:5000/api/auth/login", {
      email: "admin@afroluxe.no",
      password: "Admin@123",
    });

    console.log("✅ Login successful!");
    console.log("Status:", response.status);
    console.log("Token:", response.data.data.token ? "Present" : "Missing");
    console.log("Admin name:", response.data.data.admin.name);
    console.log("Admin role:", response.data.data.admin.role);
  } catch (error) {
    console.log("❌ Login failed!");
    console.log("Status:", error.response?.status);
    console.log("Error:", error.response?.data || error.message);
  }
};

testLogin();
