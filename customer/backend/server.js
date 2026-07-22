require("dotenv").config();
require("express-async-errors");

// ── Express Setup ──────────────────────────────────────────────────────────────
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

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

const { limiter, paymentLimiter } = require("./middleware/rateLimiter");

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  "https://food-delivery-rouge-one.vercel.app",
  "https://cloudkitchen.aparaitech.org",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:8082",
  "https://cloudkitchen.aparaitech.org/"
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.toLowerCase().trim();
  if (
    cleanOrigin.includes("localhost") ||
    cleanOrigin.includes("127.0.0.1") ||
    cleanOrigin.includes("192.168.") ||
    cleanOrigin.endsWith(".vercel.app") ||
    cleanOrigin.endsWith(".onrender.com") ||
    cleanOrigin.includes("vercel.app") ||
    allowedOrigins.some(o => o.toLowerCase() === cleanOrigin)
  ) {
    return true;
  }
  return false;
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || isAllowedOrigin(origin)) {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  }
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "10mb", type: ["application/json", "application/*+json", "text/plain"] }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Fallback JSON parser in case proxy/client sends body as raw string or Buffer
app.use((req, res, next) => {
  if (typeof req.body === "string" && req.body.trim()) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {}
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString("utf8"));
    } catch (e) {}
  }
  next();
});

// Raw Body Stream Reader Fallback Middleware for Proxy Edge Cases (Render / Cloudflare)
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method) && (!req.body || Object.keys(req.body).length === 0)) {
    const contentLength = req.headers["content-length"];
    if (contentLength && parseInt(contentLength, 10) > 0) {
      let data = "";
      req.setEncoding("utf8");
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", () => {
        if (data && data.trim()) {
          try {
            req.body = JSON.parse(data);
          } catch (err) {
            try {
              const querystring = require("querystring");
              req.body = querystring.parse(data);
            } catch (qsErr) {}
          }
        }
        next();
      });
      return;
    }
  }
  next();
});

app.use(morgan("dev"));

// General API rate limiter (applied AFTER CORS so 429 responses include CORS headers)
app.use(limiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use(["/api/auth", "/auth"], authRoutes);

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

// Health check endpoints
const healthHandler = async (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status: "UP",
    timestamp: new Date(),
    mongoDB: mongoose.connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED"
  });
};

app.get("/api/health", healthHandler);
app.get("/health", healthHandler);


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
