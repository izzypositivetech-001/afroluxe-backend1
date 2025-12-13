import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/admin.js";

dotenv.config();

const verifySpecificAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Find user by email part or just list all with roles
    const admins = await Admin.find({});
    console.log("--- CURRENT ADMIN ROLES ---");
    admins.forEach((a) => {
      console.log(JSON.stringify({ email: a.email, role: a.role, id: a._id }));
    });

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

verifySpecificAdmin();
