const express = require("express");
const { 
  generateQR, 
  createOrder, 
  verifyPayment, 
  handleWebhook, 
  processRefund, 
  getTransactions,
  checkLinkStatus
} = require("../controllers/paymentController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

// Public Webhook Route (Verified via x-razorpay-signature header)
router.post("/webhook", handleWebhook);

// Protected User Routes
router.post("/create-order", protect, createOrder);
router.post("/generate-qr", protect, generateQR);
router.post("/verify", protect, verifyPayment);
router.get("/check-link-status/:id", protect, checkLinkStatus);

// Admin Routes
router.post("/refund/:orderId", protect, processRefund);
router.get("/transactions", protect, getTransactions);

module.exports = router;
