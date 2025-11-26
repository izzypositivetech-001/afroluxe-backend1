import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import Order from "../models/order.js";
import Product from "../models/product.js";
import Admin from "../models/admin.js";
import Counter from "../models/counter.js";

dotenv.config();

const runSeed = async () => {
  console.log("🌱 Starting Analytics Seed...");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear Database
    await Order.deleteMany({});
    await Product.deleteMany({});
    await Admin.deleteMany({});
    await Counter.deleteMany({});
    console.log("🧹 Cleared Database");

    // Create Admin
    const admin = await Admin.create({
      name: "Test Admin",
      email: "admin@afroluxe.no",
      password: "Admin@123",
      role: "super_admin",
      isActive: true,
    });
    console.log("👤 Created Admin");

    // Create Products
    const products = await Product.create([
      {
        name: { en: "Best Seller Hair", no: "Bestselger Hår" },
        description: { en: "Popular item", no: "Populær vare" },
        price: 1000,
        stock: 100,
        category: new mongoose.Types.ObjectId(),
        images: ["url1"],
      },
      {
        name: { en: "Premium Wig", no: "Premium Parykk" },
        description: { en: "Expensive item", no: "Dyr vare" },
        price: 5000,
        stock: 50,
        category: new mongoose.Types.ObjectId(),
        images: ["url2"],
      },
      {
        name: { en: "Low Stock Oil", no: "Lite Lager Olje" },
        description: { en: "Running out", no: "Går tomt" },
        price: 200,
        stock: 5,
        category: new mongoose.Types.ObjectId(),
        images: ["url3"],
      },
      {
        name: { en: "Out of Stock Comb", no: "Utsolgt Kam" },
        description: { en: "Gone", no: "Borte" },
        price: 50,
        stock: 0,
        category: new mongoose.Types.ObjectId(),
        images: ["url4"],
      },
    ]);
    console.log("📦 Created 4 Products");

    // Helper to create order
    const createOrder = async (
      date,
      items,
      status = "delivered",
      paymentStatus = "paid",
      paymentMethod = "stripe"
    ) => {
      // items = [{ product: productDoc, quantity: 2 }]

      const total = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      // Manually set createdAt
      const order = new Order({
        customer: {
          name: "Test Customer",
          email: "customer@example.com",
          phone: "12345678",
        },
        shippingAddress: {
          street: "Test St",
          city: "Oslo",
          postalCode: "1234",
          country: "Norway",
        },
        items: items.map((i) => ({
          product: i.product._id,
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
        })),
        subtotal: total,
        tax: total * 0.25,
        total: total * 1.25,
        orderStatus: status,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        createdAt: date,
        updatedAt: date,
      });

      // Bypass mongoose timestamps
      await order.save({ timestamps: false });
      return order;
    };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    // Create Orders
    // 1. Today: Best Seller x 2 (Paid, Stripe)
    await createOrder(today, [{ product: products[0], quantity: 2 }]);

    // 2. Yesterday: Premium x 1 (Paid, Vipps)
    await createOrder(
      yesterday,
      [{ product: products[1], quantity: 1 }],
      "processing",
      "paid",
      "vipps"
    );

    // 3. Last Week: Best Seller x 1, Low Stock x 5 (Paid, Stripe)
    await createOrder(lastWeek, [
      { product: products[0], quantity: 1 },
      { product: products[2], quantity: 5 },
    ]);

    // 4. Last Month: Premium x 2 (Paid, Stripe)
    await createOrder(lastMonth, [{ product: products[1], quantity: 2 }]);

    // 5. Last Year: Best Seller x 10 (Paid, Stripe)
    await createOrder(lastYear, [{ product: products[0], quantity: 10 }]);

    // 6. Cancelled Order (Today)
    await createOrder(
      today,
      [{ product: products[1], quantity: 1 }],
      "cancelled",
      "refunded"
    );

    // 7. Pending Order (Today)
    await createOrder(
      today,
      [{ product: products[0], quantity: 1 }],
      "pending",
      "pending"
    );

    console.log("🛒 Created Orders");
    console.log("✅ Seed Complete");
  } catch (error) {
    console.error("❌ Seed Failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

runSeed();
