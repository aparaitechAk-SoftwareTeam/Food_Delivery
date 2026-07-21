require("dotenv").config();
require("express-async-errors");

// ── Express Setup ──────────────────────────────────────────────────────────────
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ── Route imports ──────────────────────────────────────────────────────────────
const connectDB         = require("./config/db");
const authRoutes        = require("./routes/authRoutes");
const foodRoutes        = require("./routes/foodRoutes");
const orderRoutes       = require("./routes/orderRoutes");
const categoryRoutes    = require("./routes/categoryRoutes");
const restaurantRoutes  = require("./routes/restaurantRoutes");
const reviewRoutes      = require("./routes/reviewRoutes");
const cartRoutes        = require("./routes/cartRoutes");
const wishlistRoutes    = require("./routes/wishlistRoutes");
const userRoutes        = require("./routes/userRoutes");
const favoriteRoutes    = require("./routes/favoriteRoutes");
const bannerRoutes      = require("./routes/bannerRoutes");
const searchRoutes      = require("./routes/searchRoutes");
const adminRoutes       = require("./routes/adminRoutes");
const paymentRoutes     = require("./routes/paymentRoutes");
const deliveryRoutes    = require("./routes/deliveryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const sectionRoutes      = require("./routes/sectionRoutes");
const couponRoutes       = require("./routes/couponRoutes");
const rewardRoutes       = require("./routes/rewardRoutes");
const walletRoutes       = require("./routes/walletRoutes");
const membershipRoutes   = require("./routes/membershipRoutes");
const referralRoutes     = require("./routes/referralRoutes");
const campaignRoutes     = require("./routes/campaignRoutes");
const errorHandler      = require("./middleware/errorHandler");

// Rate limiter: maximum 300 requests per 15 minutes per IP (global fallback)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === "/api/health",
});

// Stricter limiter for authentication endpoints (prevents brute-force)
// 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many authentication attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for payment endpoints
// 30 requests per 15 minutes per IP
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many payment requests. Please try again shortly." },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
app.use(helmet());
app.use(limiter);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  "https://food-delivery-rouge-one.vercel.app",
  "https://cloudkitchen.aparaitech.org",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:8082",
  "https://cloudkitchen.aparaitech.org",
  "https://food-delivery-pi-drab.vercel.app"
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      // Allow local development origins dynamically
      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
      if (isLocal || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      console.warn(`Origin ${origin} blocked by CORS`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());
app.use(morgan("dev"));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth",        authLimiter, authRoutes);
app.use("/api/foods",       foodRoutes);
app.use("/api/products",    foodRoutes);   // alias
app.use("/api/orders",      orderRoutes);
app.use("/api/categories",  categoryRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/reviews",     reviewRoutes);
app.use("/api/cart",        cartRoutes);
app.use("/api/wishlist",    wishlistRoutes);
app.use("/api/user",        userRoutes);
app.use("/api/favorites",   favoriteRoutes);
app.use("/api/banners",     bannerRoutes);
app.use("/api/search",      searchRoutes);
app.use("/api/payment",     paymentLimiter, paymentRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/delivery",    deliveryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sections",      sectionRoutes);
app.use("/api/home-sections", require("./routes/homeSectionRoutes"));
app.use("/api/coupons",       couponRoutes);
app.use("/api/rewards",       rewardRoutes);
app.use("/api/wallet",        walletRoutes);
app.use("/api/memberships",   membershipRoutes);
app.use("/api/referrals",     referralRoutes);
app.use("/api/campaigns",     campaignRoutes);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status: "UP",
    timestamp: new Date(),
    mongoDB: mongoose.connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED"
  });
});

// ── Global error handler (must be last) ────────────────────────────────────────
app.use(errorHandler);

// ── Config ─────────────────────────────────────────────────────────────────────
const PORT      = parseInt(process.env.PORT || "5000", 10);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(
    "\n❌  Missing MONGO_URI in backend/.env\n" +
    "   Add: MONGO_URI=your_mongodb_connection_string\n"
  );
  process.exit(1);
}

// ── Startup ────────────────────────────────────────────────────────────────────
// Guard against being required as a module (prevents duplicate server instances)
if (require.main === module) {
  const startServer = () => {
    connectDB(MONGO_URI)
      .then(async () => {
        // Initialize default admin account if not exists
        const initializeAdmin = require("./config/initAdmin");
        await initializeAdmin();

        // Initialize default user accounts if not exists
        const initializeDefaultUsers = require("./config/initDefaultUsers");
        await initializeDefaultUsers();

        // Initialize default home screen sections if not exists
        const initializeHomeSections = require("./config/initHomeSections");
        await initializeHomeSections();

        // Initialize single restaurant settings and link foods
        const initializeSingleRestaurant = require("./config/initSingleRestaurant");
        await initializeSingleRestaurant();

        // Sync combos to the Food collection for customer app order compatibility
        const syncExistingCombos = require("./config/syncExistingCombos");
        await syncExistingCombos();

        // Start the HTTP server — only once, only after DB is ready
        const server = app.listen(PORT, () => {
          console.log(`\n✅  Server running on port ${PORT}\n`);
        });

        // Initialize Socket.IO
        const { initSocket } = require("./config/socket");
        initSocket(server);

        // ── Graceful EADDRINUSE handler ─────────────────────────────────────────
        server.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            console.error(
              `\n❌  Port ${PORT} is already in use.\n\n` +
              `   Another process is holding this port.\n` +
              `   Run these commands to free it:\n\n` +
              `   Windows:\n` +
              `     netstat -ano | findstr :${PORT}\n` +
              `     taskkill /F /PID <PID>\n\n` +
              `   Mac / Linux:\n` +
              `     lsof -ti:${PORT} | xargs kill -9\n\n` +
              `   Then restart the server.\n`
            );
            process.exit(1);
          } else {
            console.error("Server error:", err);
            process.exit(1);
          }
        });

        // ── Graceful shutdown on SIGTERM / SIGINT ────────────────────────────────
        const shutdown = (signal) => {
          console.log(`\n[${signal}] Shutting down server gracefully...`);
          server.close(() => {
            console.log("Server closed.");
            process.exit(0);
          });
          setTimeout(() => process.exit(0), 5000).unref();
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT",  () => shutdown("SIGINT"));
      })
      .catch((err) => {
        console.error("Failed to connect to MongoDB:", err.message);
        process.exit(1);
      });
  };

  const dns = require("dns");
  console.log("Checking DNS resolution for MongoDB Atlas...");
  dns.resolveSrv("_mongodb._tcp.cluster0.bxevqzc.mongodb.net", (err) => {
    if (err) {
      console.log("ℹ️  Default DNS failed to resolve MongoDB SRV. Applying custom Google DNS (8.8.8.8)...");
      try {
        dns.setServers(["8.8.8.8", "8.8.4.4"]);
      } catch (dnsErr) {
        console.warn("⚠️  Could not set custom DNS servers:", dnsErr.message);
      }
    } else {
      console.log("✅  Default DNS successfully resolved MongoDB SRV. Skipping DNS override.");
    }
    startServer();
  });
}

module.exports = app;
