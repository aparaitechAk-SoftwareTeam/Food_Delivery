const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  paymentId: { type: String, required: true }, // Razorpay Payment ID (e.g. pay_...)
  razorpayOrderId: { type: String }, // Razorpay Order ID or QR Code ID
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  paymentMethod: { type: String, default: "UPI" },
  paymentStatus: { type: String, default: "Captured" },
  transactionTime: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = mongoose.model("Payment", paymentSchema);
