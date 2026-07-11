const mongoose = require("mongoose");

const deliveryLocationSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    deliveryBoyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryLocation", deliveryLocationSchema);
