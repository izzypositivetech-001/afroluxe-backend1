import mongoose from "mongoose";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Admin from "../models/admin.js";
import Product from "../models/product.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "http://localhost:5000/api";
const SAMPLE_IMAGE_PATH = path.join(__dirname, "test-image.png");

// 1x1 pixel transparent PNG
const SAMPLE_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const runTest = async () => {
  console.log("🚀 Starting Cloudinary Upload Test...");

  try {
    // 1. Connect to DB
    console.log("1. Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 2. Create Temp Admin User
    console.log("2. Creating Temporary Admin User...");
    const tempAdmin = await Admin.create({
      name: "Test Admin",
      email: `testadmin_${Date.now()}@example.com`,
      password: "password123",
      role: "super_admin", // Use super_admin to be safe
    });
    console.log(`✅ Created admin user: ${tempAdmin.email}`);

    // Generate Token
    const token = jwt.sign(
      { id: tempAdmin._id, role: tempAdmin.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // 3. Create Temp Product
    console.log("3. Creating Temporary Product...");
    const tempProduct = await Product.create({
      name: { en: "Test Product", no: "Test Produkt" },
      description: { en: "Test Desc", no: "Test Beskrivelse" },
      price: 100,
      category: new mongoose.Types.ObjectId(), // Random ObjectId for category
      stock: 10,
      images: [],
    });
    console.log(`✅ Created product: ${tempProduct._id}`);

    // 4. Create Sample Image File
    console.log("4. Creating Sample Image File...");
    fs.writeFileSync(
      SAMPLE_IMAGE_PATH,
      Buffer.from(SAMPLE_IMAGE_BASE64, "base64")
    );
    console.log("✅ Created test-image.png");

    // 5. Upload Image
    console.log("5. Uploading Image to Cloudinary...");
    const formData = new FormData();
    formData.append("images", fs.createReadStream(SAMPLE_IMAGE_PATH));

    const uploadRes = await axios.post(
      `${API_URL}/admin/images/products/${tempProduct._id}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Upload Response Status:", uploadRes.status);
    console.log("✅ Uploaded Images:", uploadRes.data.data.uploadedImages);

    const uploadedImageUrl = uploadRes.data.data.uploadedImages[0].url;

    // 6. Verify in DB
    console.log("6. Verifying in Database...");
    const updatedProduct = await Product.findById(tempProduct._id);
    if (updatedProduct.images.includes(uploadedImageUrl)) {
      console.log("✅ Image URL found in Product document");
    } else {
      console.error("❌ Image URL NOT found in Product document");
    }

    // 7. Verify URL is accessible
    console.log("7. Verifying Image URL is accessible...");
    try {
      await axios.head(uploadedImageUrl);
      console.log("✅ Image is accessible on Cloudinary");
    } catch (e) {
      console.error("❌ Image is NOT accessible on Cloudinary");
    }

    // 8. Delete Image
    console.log("8. Deleting Image...");
    // Need image index. It should be 0.
    const deleteRes = await axios.delete(
      `${API_URL}/admin/images/products/${tempProduct._id}/0`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("✅ Delete Response Status:", deleteRes.status);

    // 9. Cleanup
    console.log("9. Cleaning up...");
    await Product.findByIdAndDelete(tempProduct._id);
    await Admin.findByIdAndDelete(tempAdmin._id);
    fs.unlinkSync(SAMPLE_IMAGE_PATH);
    console.log("✅ Cleanup complete");
  } catch (error) {
    console.error("❌ Test Failed:", error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Test Finished");
  }
};

runTest();
