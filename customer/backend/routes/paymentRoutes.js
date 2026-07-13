const express = require("express");
const { 
  generateQR, 
  verifyPayment, 
  createRazorpayOrder, 
  checkoutPage, 
  successCallback, 
  cancelCallback 
} = require("../controllers/paymentController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

// Public Web Checkout pages (no auth header needed when loaded inside external mobile browsers)
router.get("/checkout-page", checkoutPage);
router.get("/success-callback", successCallback);
router.get("/cancel-callback", cancelCallback);

// Protected routes
router.use(protect);
router.post("/generate-qr", generateQR);
router.post("/create-order", createRazorpayOrder);
router.post("/verify", verifyPayment);

module.exports = router;
