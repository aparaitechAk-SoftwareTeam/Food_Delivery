const express = require("express");
const { generateQR, verifyPayment } = require("../controllers/paymentController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect);
router.post("/generate-qr", generateQR);
router.post("/verify", verifyPayment);

module.exports = router;
