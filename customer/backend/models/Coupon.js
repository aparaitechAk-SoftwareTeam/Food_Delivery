const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    default: "percentage",
  },
  value: { type: Number, required: true },
  active: { type: Boolean, default: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  status: {
    type: String,
    enum: ["Active", "Used", "Expired"],
    default: "Active",
  },
  usedAt: { type: Date },
  relatedRewardId: { type: mongoose.Schema.Types.ObjectId, ref: "CashbackReward" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Coupon", couponSchema);
