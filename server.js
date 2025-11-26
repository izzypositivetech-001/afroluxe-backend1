import express from "express";
import "dotenv/config";
import morgan from "morgan";
import connectDB from "./config/database.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import languageMiddleware from "./middleware/languageMiddleware.js";
import ResponseHandler from "./utils/responseHandler.js";

import {
  configureHelmet,
  configureCors,
  configureMongoSanitize,
  configureXssClean,
  configureHpp,
  securityHeaders,
  securityLogger,
  ipBlocker,
} from "./middleware/security.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

connectDB();

// Security middleware (applied in order)
app.use(ipBlocker); // Block banned IPs first
app.use(securityLogger); // Log suspicious activity
app.use(configureHelmet()); // Security headers
app.use(configureCors()); // CORS configuration
app.use(securityHeaders); // Additional security headers

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization
app.use(configureMongoSanitize()); // Prevent NoSQL injection
app.use(configureXssClean()); // Prevent XSS attacks
app.use(configureHpp()); // Prevent HTTP parameter pollution

// Apply general rate limiting to all routes
app.use("/api/", apiLimiter);

// Morgan logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Language middleware
app.use(languageMiddleware);

app.get("/", (req, res) => {
  ResponseHandler.success(res, 200, "Welcome to the Afroluxe API", {
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  ResponseHandler.success(res, 200, "API is healthy", {
    status: "OK",
    database: "Connected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

//Routes
import productRoutes from "./routes/productsRoutes.js";
import adminProductRoutes from "./routes/adminProductRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";

// Import specific rate limiters
import {
  authLimiter,
  orderLimiter,
  searchLimiter,
  paymentLimiter,
  adminLimiter,
} from "./middleware/rateLimiter.js";

app.use("/api/products", productRoutes);
app.use("/api/admin/products", adminLimiter, adminProductRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", orderLimiter, orderRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin/users", adminLimiter, adminRoutes);
app.use("/api/payments", paymentLimiter, paymentRoutes);
app.use("/api/admin/orders", adminLimiter, adminOrderRoutes);
app.use("/api/admin/images", adminLimiter, imageRoutes);
app.use("/api/admin/analytics", adminLimiter, analyticsRoutes);
app.use("/api/search", searchLimiter, searchRoutes);
app.use("/api/admin/security", securityRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AfroLuxe Backend Server`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
