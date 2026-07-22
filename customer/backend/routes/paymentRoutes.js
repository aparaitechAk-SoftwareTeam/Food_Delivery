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

router.post("/webhook", handleWebhook);

router.post("/create-order", protect, createOrder);
router.post("/generate-qr", protect, generateQR);
router.post("/verify", protect, verifyPayment);
router.get("/check-link-status/:id", protect, checkLinkStatus);

router.post("/refund/:orderId", protect, processRefund);
router.get("/transactions", protect, getTransactions);

module.exports = router;
