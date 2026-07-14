const Coupon = require("../models/Coupon");

exports.getCoupons = async (req, res) => {
  try {
    // Return global active coupons + active coupons owned by this user
    const coupons = await Coupon.find({
      active: true,
      status: "Active",
      $or: [
        { userId: null },
        { userId: req.user._id }
      ]
    });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyCoupons = async (req, res) => {
  try {
    const userId = req.user._id;

    // Load coupons and auto-expire active ones if expiration time has passed
    const now = new Date();
    await Coupon.updateMany(
      { userId, status: "Active", expiresAt: { $lte: now } },
      { $set: { status: "Expired" } }
    );

    const active = await Coupon.find({ userId, status: "Active" }).sort({ createdAt: -1 });
    const used = await Coupon.find({ userId, status: "Used" }).sort({ usedAt: -1 });
    const expired = await Coupon.find({ userId, status: "Expired" }).sort({ expiresAt: -1 });

    res.json({ active, used, expired });
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
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon code" });
    }

    if (!coupon.active) {
      return res.status(400).json({ message: "This coupon is inactive" });
    }

    if (coupon.status === "Used") {
      return res.status(400).json({ message: "This coupon has already been used" });
    }

    if (coupon.status === "Expired" || (coupon.expiresAt && new Date() >= coupon.expiresAt)) {
      if (coupon.status === "Active") {
        coupon.status = "Expired";
        await coupon.save();
      }
      return res.status(400).json({ message: "This coupon has expired" });
    }

    // Verify user ownership if the coupon is user-restricted
    if (coupon.userId && req.user && coupon.userId.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: "This coupon is private and cannot be used by this account" });
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
        maxDiscount: coupon.maxDiscount || coupon.value
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
