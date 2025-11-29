import mongoose from "mongoose";
import dotenv from "dotenv";
import Cart from "../models/cart.js";
import Product from "../models/product.js";
import Order from "../models/order.js";
import connectDB from "../config/database.js";
import { createOrder } from "../controllers/orderController.js";

dotenv.config();

// Mock Express Request/Response
const mockReq = (body) => ({
  body,
  language: "en",
});

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    console.log(`Response [${res.statusCode}]:`, JSON.stringify(data, null, 2));
    return res;
  };
  return res;
};

const mockNext = (err) => {
  if (err) {
    console.error("Next called with error:", err);
  }
};

const testCheckout = async () => {
  try {
    await connectDB();
    console.log("Connected to database...");

    // 1. Find a product
    const product = await Product.findOne({
      isActive: true,
      stock: { $gt: 0 },
    });
    if (!product) {
      console.error("No active products found to test with.");
      process.exit(1);
    }
    console.log(`Found product: ${product.name.en} (${product._id})`);

    // 2. Create a Cart
    const sessionId = "test-session-" + Date.now();
    const cart = await Cart.create({
      sessionId,
      items: [
        {
          product: product._id,
          quantity: 1,
          price: product.price,
        },
      ],
    });
    console.log(`Created cart with session ID: ${sessionId}`);

    // 3. Prepare Order Data
    const orderData = {
      sessionId,
      customer: {
        name: "Test User",
        email: "test@example.com",
        phone: "12345678",
      },
      shippingAddress: {
        street: "Test Street 1",
        city: "Oslo",
        postalCode: "0123",
        country: "Norway",
      },
      notes: "Test order from script",
    };

    // 4. Call createOrder controller directly
    console.log("Calling createOrder controller...");
    await createOrder(mockReq(orderData), mockRes(), mockNext);

    // 5. Verify Order Created
    const order = await Order.findOne({
      "customer.email": "test@example.com",
    }).sort({ createdAt: -1 });
    if (order) {
      console.log(`Order created successfully: ${order.orderId}`);
    } else {
      console.error("Order was NOT found in database.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
};

testCheckout();
