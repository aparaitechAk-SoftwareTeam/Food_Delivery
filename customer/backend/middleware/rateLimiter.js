const rateLimit = require("express-rate-limit");

// General API Rate limiter: maximum 300 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for CORS preflight OPTIONS requests and health check endpoints
  skip: (req) => req.method === "OPTIONS" || req.path === "/api/health" || req.path === "/health",
});

// Stricter limiter for sensitive authentication endpoints (prevents brute-force)
// 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many authentication attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});

// Stricter limiter for payment endpoints
// 30 requests per 15 minutes per IP
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many payment requests. Please try again shortly." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});

module.exports = {
  limiter,
  authLimiter,
  paymentLimiter,
};
