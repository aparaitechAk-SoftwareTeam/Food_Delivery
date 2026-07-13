const mongoose = require("mongoose");

const orderTrackingSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    status: { type: String, required: true, default: "Pending" },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        description: { type: String },
      },
    ],
    eta: { type: String, default: "30 mins" }, // e.g. "25 mins"
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderTracking", orderTrackingSchema);
