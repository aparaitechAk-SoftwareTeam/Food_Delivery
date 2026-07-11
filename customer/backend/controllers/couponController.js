const Coupon = require("../models/Coupon");

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ active: true });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Coupon code is required" });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon code" });
    }

    if (orderAmount && orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`
      });
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
