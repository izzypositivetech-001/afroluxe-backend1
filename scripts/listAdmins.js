import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/admin.js";

dotenv.config();

const listAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const admins = await Admin.find({});
    console.log("--- ADMIN USERS ---");
    admins.forEach((a) => {
      console.log(`ID: ${a._id}`);
      console.log(`Name: ${a.name}`);
      console.log(`Email: ${a.email}`);
      console.log(`Role: '${a.role}'`); // Quote to see whitespace/case
      console.log(`Status: ${a.status}`);
      console.log("-------------------");
    });

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

listAdmins();
