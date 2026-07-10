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
app.use(helmet());
app.use(limiter);

app.use(
  cors({
    origin: [
      "https://food-delivery-rouge-one.vercel.app",
      "https://cloudkitchen.aparaitech.org",
      "http://localhost:5173",
      "http://localhost:8081",
      "http://localhost:8082",
      "https://cloudkitchen.aparaitech.org/"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
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
  console.error(
    "\n❌  Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in backend/.env\n" +
    "   Please add them to enable secure online payment integration.\n"
  );
  process.exit(1);
}

// ── Startup ────────────────────────────────────────────────────────────────────
// Guard against being required as a module (prevents duplicate server instances)
if (require.main === module) {
  connectDB(MONGO_URI)
    .then(() => {
      // Seed / mock data
      if (process.env.MOCK_DB === "true") {
        const { initializeMockData } = require("./config/mockDataStore");
        initializeMockData();
      } else {
        seedDatabase();
      }

      // Start the HTTP server — only once, only after DB is ready
      const server = app.listen(PORT, () => {
        console.log(`\n✅  Server running on port ${PORT}\n`);
      });

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
