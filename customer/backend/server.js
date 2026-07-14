require("dotenv").config();
require("express-async-errors");

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
const seedDatabase      = require("./config/seed");

// Rate limiter: maximum 300 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
app.set("trust proxy", 1); // Required for Render/Heroku proxy — correct IP for rate limiting
app.use(helmet());
app.use(limiter);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  // Vercel deployments (admin panel)
  "https://food-delivery-rouge-one.vercel.app",
  "https://cloudkitchen.aparaitech.org",
  "https://cloudkitchen.aparaitech.org/",
  // Local development
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:19000",
  "http://localhost:19006",
  // Expo Go & Expo Web
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19000",
  "http://127.0.0.1:19006",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, React Native)
      if (!origin) return callback(null, true);
      // Allow any vercel.app subdomain (for preview deployments)
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      // Allow any render.com subdomain (service-to-service)
      if (origin.endsWith(".onrender.com")) return callback(null, true);
      // Allow any localhost or 192.168.x.x (development)
      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        /^http:\/\/192\.168\.\d+\.\d+/.test(origin)
      ) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`[CORS] Origin blocked: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);
app.use(express.json());
app.use(morgan("dev"));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
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
app.use("/api/payment",     paymentRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api/delivery",    deliveryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sections",      sectionRoutes);
app.use("/api/coupons",       couponRoutes);
app.use("/api/rewards",       rewardRoutes);
app.use("/api/wallet",        walletRoutes);
app.use("/api/memberships",   membershipRoutes);
app.use("/api/referrals",     referralRoutes);
app.use("/api/campaigns",     campaignRoutes);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const mongoose = require("mongoose");
  const dbState = mongoose.connection.readyState;
  res.json({
    success: true,
    status: "running",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    mongoDB: dbState === 1 ? "CONNECTED" : dbState === 2 ? "CONNECTING" : "DISCONNECTED"
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

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn(
    "\n⚠️   RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not found in .env\n" +
    "   Payment features will run in sandbox/dummy mode.\n"
  );
}

// ── Startup ────────────────────────────────────────────────────────────────────
// Guard against being required as a module (prevents duplicate server instances)
if (require.main === module) {
  connectDB(MONGO_URI)
    .then(() => {
      // Seed / mock data
      seedDatabase();

      // Start the HTTP server — only once, only after DB is ready
      const server = app.listen(PORT, () => {
        console.log(`\n✅  Server running on port ${PORT}\n`);
      });

      // Initialize Socket.IO
      const { initSocket } = require("./config/socket");
      initSocket(server);

      // ── Graceful EADDRINUSE handler ─────────────────────────────────────────
      // process.exit(1) stops nodemon from restarting (nodemon exits on code 1
      // only when exitcrash is configured — see nodemon.json).
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
          // Exit with code 1 so nodemon does NOT auto-restart (exitcrash: false in nodemon.json)
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
        // Force-exit after 5 s if connections don't drain
        setTimeout(() => process.exit(0), 5000).unref();
      };

      process.on("SIGTERM", () => shutdown("SIGTERM"));
      process.on("SIGINT",  () => shutdown("SIGINT"));
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err.message);
      process.exit(1);
    });
}

module.exports = app;
