import mongoose from "mongoose";
import dotenv from "dotenv";
import seedAdmin from "../seeds/adminSeed.js";

dotenv.config({ path: "./backend/.env" });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await seedAdmin();

    console.log("Done");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
