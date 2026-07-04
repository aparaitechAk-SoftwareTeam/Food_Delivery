const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  items: [
    {
      food: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  address: {
    label: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  paymentMethod: { type: String, default: "Cash on Delivery" },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
  discount: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 40 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }, // Grand Total
  status: {
    type: String,
    enum: [
      "Pending",
      "Confirmed",
      "Preparing",
      "Out For Delivery",
      "Delivered",
      "Cancelled",
    ],
    default: "Pending",
  },
  orderNumber: { type: String, required: true },
  cancellationReason: { type: String },
  transactionId: { type: String },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
