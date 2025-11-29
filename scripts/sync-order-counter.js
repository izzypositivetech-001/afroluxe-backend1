import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/order.js";
import Counter from "../models/counter.js";
import connectDB from "../config/database.js";

dotenv.config();

const syncOrderCounter = async () => {
  try {
    await connectDB();
    console.log("Connected to database...");

    // 1. Get ALL order IDs
    const orders = await Order.find({}, "orderId");
    console.log(`Found ${orders.length} orders.`);

    if (orders.length === 0) {
      console.log("No orders found. Resetting counter to 0.");
      await Counter.findOneAndUpdate(
        { id: "orderId" },
        { seq: 0 },
        { upsert: true, new: true }
      );
      process.exit(0);
    }

    // 2. Find Max Sequence
    let maxSeq = 0;
    const currentYear = new Date().getFullYear();

    orders.forEach((order) => {
      if (!order.orderId) return;

      // Format: ALX-YYYY-SEQ
      const parts = order.orderId.split("-");
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq)) {
          if (seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    });

    console.log(`Calculated Max Sequence: ${maxSeq}`);

    // 3. Update Counter
    // We set it to maxSeq, so the next increment will be maxSeq + 1
    const updatedCounter = await Counter.findOneAndUpdate(
      { id: "orderId" },
      { $set: { seq: maxSeq } },
      { upsert: true, new: true }
    );

    console.log(`Counter updated to: ${updatedCounter.seq}`);
    console.log(
      `Next Order ID will be: ALX-${currentYear}-${String(maxSeq + 1).padStart(
        4,
        "0"
      )}`
    );

    process.exit(0);
  } catch (error) {
    console.error("Error syncing counter:", error);
    process.exit(1);
  }
};

syncOrderCounter();
