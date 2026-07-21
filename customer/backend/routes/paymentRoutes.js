const express = require("express");
const { createOrder, verifyPayment, getPaymentStatus } = require("../controllers/paymentController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.get("/status/:paymentId", getPaymentStatus);

module.exports = router;
