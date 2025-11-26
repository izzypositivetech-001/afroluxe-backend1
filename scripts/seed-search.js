import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/product.js";
import Category from "../models/category.js";
import Admin from "../models/admin.js";
import Counter from "../models/counter.js";

dotenv.config();

const runSeed = async () => {
  console.log("🔍 Starting Search Test Data Seed...");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Admin.deleteMany({});
    await Counter.deleteMany({});
    console.log("🧹 Cleared Database");

    // Create admin for authentication
    await Admin.create({
      name: "Search Test Admin",
      email: "admin@afroluxe.no",
      password: "Admin@123",
      role: "super_admin",
      isActive: true,
    });
    console.log("👤 Created Admin");

    // Create categories
    const categories = await Category.create([
      {
        name: { en: "Hair Extensions", no: "Hårforlengelser" },
        slug: "hair-extensions",
        description: {
          en: "Premium hair extensions",
          no: "Premium hårforlengelser",
        },
        isActive: true,
      },
      {
        name: { en: "Wigs", no: "Parykker" },
        slug: "wigs",
        description: {
          en: "Natural looking wigs",
          no: "Naturlig utseende parykker",
        },
        isActive: true,
      },
      {
        name: { en: "Hair Care", no: "Håromsorg" },
        slug: "hair-care",
        description: { en: "Hair care products", no: "Hårpleieprodukter" },
        isActive: true,
      },
      {
        name: { en: "Accessories", no: "Tilbehør" },
        slug: "accessories",
        description: { en: "Hair accessories", no: "Hårtilbehør" },
        isActive: true,
      },
    ]);
    console.log("📁 Created 4 Categories");

    // Create diverse products for testing
    const products = await Product.create([
      // Hair Extensions - varied prices and stock
      {
        name: { en: "Brazilian Straight Hair", no: "Brasiliansk Rett Hår" },
        description: {
          en: "Premium Brazilian straight hair extensions",
          no: "Premium brasiliansk rett hårforlengelser",
        },
        price: 899,
        stock: 50,
        category: categories[0]._id,
        sku: "BSH-001",
        salesCount: 150,
        tags: ["brazilian", "straight", "premium"],
        images: ["https://example.com/image1.jpg"],
        isActive: true,
      },
      {
        name: { en: "Curly Hair Bundle", no: "Krøllete Hår Pakke" },
        description: {
          en: "Natural curly hair bundle",
          no: "Naturlig krøllete hår pakke",
        },
        price: 1299,
        stock: 30,
        category: categories[0]._id,
        sku: "CHB-002",
        salesCount: 89,
        tags: ["curly", "bundle", "natural"],
        images: ["https://example.com/image2.jpg"],
        isActive: true,
      },
      {
        name: {
          en: "Silky Weave Extensions",
          no: "Silkeaktig Innvevd Forlengelser",
        },
        description: {
          en: "Ultra smooth silky weave",
          no: "Ultra glatt silkeaktig innvevd",
        },
        price: 649,
        stock: 5, // Low stock
        category: categories[0]._id,
        sku: "SWE-003",
        salesCount: 45,
        tags: ["silky", "weave", "smooth"],
        images: ["https://example.com/image3.jpg"],
        isActive: true,
      },
      // Wigs - different price ranges
      {
        name: { en: "Luxury Lace Front Wig", no: "Luksus Blonde Front Parykk" },
        description: {
          en: "Premium lace front wig",
          no: "Premium blonde front parykk",
        },
        price: 3499,
        stock: 15,
        category: categories[1]._id,
        sku: "LLF-004",
        salesCount: 120,
        tags: ["luxury", "lace", "front"],
        images: ["https://example.com/image4.jpg"],
        isActive: true,
      },
      {
        name: { en: "Natural Bob Wig", no: "Naturlig Bob Parykk" },
        description: {
          en: "Stylish bob cut wig",
          no: "Stilig bob kutt parykk",
        },
        price: 1899,
        stock: 25,
        category: categories[1]._id,
        sku: "NBW-005",
        salesCount: 200, // Most popular
        tags: ["bob", "natural", "stylish"],
        images: ["https://example.com/image5.jpg"],
        isActive: true,
      },
      {
        name: { en: "Long Wavy Wig", no: "Lang Bølget Parykk" },
        description: {
          en: "Beautiful long wavy wig",
          no: "Vakker lang bølget parykk",
        },
        price: 2199,
        stock: 0, // Out of stock
        category: categories[1]._id,
        sku: "LWW-006",
        salesCount: 75,
        tags: ["long", "wavy", "beautiful"],
        images: ["https://example.com/image6.jpg"],
        isActive: true,
      },
      // Hair Care - lower prices
      {
        name: { en: "Moisturizing Shampoo", no: "Fuktighetsgivende Sjampo" },
        description: {
          en: "Deep moisturizing shampoo",
          no: "Dyp fuktighetsgivende sjampo",
        },
        price: 199,
        stock: 100,
        category: categories[2]._id,
        sku: "MSH-007",
        salesCount: 180,
        tags: ["shampoo", "moisturizing", "care"],
        images: ["https://example.com/image7.jpg"],
        isActive: true,
      },
      {
        name: { en: "Hair Growth Oil", no: "Hårvekst Olje" },
        description: {
          en: "Natural hair growth oil",
          no: "Naturlig hårvekst olje",
        },
        price: 349,
        stock: 60,
        category: categories[2]._id,
        sku: "HGO-008",
        salesCount: 95,
        tags: ["oil", "growth", "natural"],
        images: ["https://example.com/image8.jpg"],
        isActive: true,
      },
      // Accessories - varied
      {
        name: { en: "Silk Hair Bonnet", no: "Silke Hår Hette" },
        description: {
          en: "Protective silk bonnet",
          no: "Beskyttende silke hette",
        },
        price: 129,
        stock: 80,
        category: categories[3]._id,
        sku: "SHB-009",
        salesCount: 110,
        tags: ["bonnet", "silk", "protective"],
        images: ["https://example.com/image9.jpg"],
        isActive: true,
      },
      {
        name: { en: "Premium Hair Brush", no: "Premium Hårbørste" },
        description: {
          en: "Professional detangling brush",
          no: "Profesjonell utredning børste",
        },
        price: 249,
        stock: 40,
        category: categories[3]._id,
        sku: "PHB-010",
        salesCount: 65,
        tags: ["brush", "premium", "detangling"],
        images: ["https://example.com/image10.jpg"],
        isActive: true,
      },
    ]);

    console.log("✅ Created 10 Products with varied:");
    console.log("   - Prices: 129 NOK - 3499 NOK");
    console.log("   - Stock levels: 0 (out), 5 (low), 15-100 (normal)");
    console.log("   - Sales counts: 45-200");
    console.log("   - 4 categories with EN/NO names");
    console.log("   - SKUs, tags, and descriptions");
    console.log("");
    console.log("✅ Seed Complete - Ready for Testing!");
  } catch (error) {
    console.error("❌ Seed Failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

runSeed();
