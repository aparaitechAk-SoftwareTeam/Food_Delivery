const express = require("express");
const router = express.Router();
const { getCoupons, getMyCoupons, validateCoupon } = require("../controllers/couponController");
const protect = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getCoupons);
router.get("/my", getMyCoupons);
router.post("/validate", validateCoupon);

module.exports = router;
