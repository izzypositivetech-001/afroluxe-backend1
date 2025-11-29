import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/order.js";
import connectDB from "../config/database.js";

dotenv.config();

const debugOrders = async () => {
  try {
    await connectDB();
    console.log("Connected to database...");

    const orders = await Order.find({}, "orderId createdAt").sort({
      createdAt: -1,
    });

    console.log("Existing Orders:");
    orders.forEach((o) => {
      console.log(`ID: ${o.orderId}, Created: ${o.createdAt}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

debugOrders();
