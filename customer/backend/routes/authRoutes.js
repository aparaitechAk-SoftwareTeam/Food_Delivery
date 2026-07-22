const express = require("express");
const {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  me,
  logout,
  googleLogin,
} = require("../controllers/authController");
const { getProfile, updateProfile } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Sensitive authentication endpoints (protected by strict authLimiter against brute-force attacks)
router.post("/register", authLimiter, register);
router.post("/signup", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/verify-otp", authLimiter, verifyOtp);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/google", authLimiter, googleLogin);

// Non-sensitive authentication / user session endpoints (use general API rate limiter)
router.post("/logout", logout);
router.get("/me", protect, me);

// Profile endpoint aliases under /auth/ (GET /auth/profile, PUT /auth/profile)
router.route("/profile")
  .get(protect, getProfile)
  .put(protect, updateProfile);

module.exports = router;

