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
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.post("/google", googleLogin);
router.get("/me", protect, me);

module.exports = router;
