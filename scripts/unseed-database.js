import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/order.js";
import Product from "../models/product.js";
import Category from "../models/category.js";
import Admin from "../models/admin.js";
import Counter from "../models/counter.js";
import Cart from "../models/cart.js";
import Coupon from "../models/coupon.js";

dotenv.config({ path: "./backend/.env" });

const unseedDatabase = async () => {
  console.log("🧹 Starting Database Cleanup...");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear all collections
    const collections = [
      { name: "Orders", model: Order },
      { name: "Products", model: Product },
      { name: "Categories", model: Category },
      { name: "Admins", model: Admin },
      { name: "Counters", model: Counter },
      { name: "Carts", model: Cart },
      { name: "Coupons", model: Coupon },
    ];

    for (const { name, model } of collections) {
      try {
        const result = await model.deleteMany({});
        console.log(`   - Cleared ${name}: ${result.deletedCount} documents`);
      } catch (err) {
        // Ignore error if model/collection doesn't exist or is empty
        console.log(`   - Skipped ${name} (or error: ${err.message})`);
      }
    }

    console.log("✨ Database successfully unseeded!");
  } catch (error) {
    console.error("❌ Cleanup Failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
};

unseedDatabase();
