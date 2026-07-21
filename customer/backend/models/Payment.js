const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paymentId: { type: String, required: true },
  razorpayOrderId: { type: String },
  razorpaySignature: { type: String },
  receipt: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  paymentMethod: { type: String, default: "Razorpay Online" },
  paymentStatus: { 
    type: String, 
    enum: ["Pending", "Paid", "Captured", "Failed", "Refunded"], 
    default: "Captured" 
  },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },
  refundInfo: {
    refundId: { type: String },
    amount: { type: Number },
    status: { type: String },
    refundedAt: { type: Date }
  },
  webhookLogs: [
    {
      event: { type: String },
      payload: { type: mongoose.Schema.Types.Mixed },
      receivedAt: { type: Date, default: Date.now }
    }
  ],
  transactionTime: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
