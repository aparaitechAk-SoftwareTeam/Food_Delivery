const Coupon = require("../models/Coupon");

exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.find({ active: true });
  res.json(coupons);
};
