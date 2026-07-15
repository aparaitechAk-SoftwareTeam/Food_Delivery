const express = require("express");
const router = express.Router();
const { getCoupons, getMyCoupons, validateCoupon } = require("../controllers/couponController");
const protect = require("../middleware/authMiddleware");
const optionalProtect = protect.optionalProtect;

router.get("/", optionalProtect, getCoupons);
router.get("/my", protect, getMyCoupons);
router.post("/validate", optionalProtect, validateCoupon);

module.exports = router;
