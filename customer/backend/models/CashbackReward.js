const mongoose = require("mongoose");

const cashbackRewardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    totalRequiredOrders: { type: Number, default: 4 },
    completedOrders: { type: Number, default: 0 },
    cashbackAmount: { type: Number, default: 150 },
    status: {
      type: String,
      enum: ["Pending", "Eligible", "Claimed", "Expired"],
      default: "Pending",
    },
    expiryDate: { type: Date, required: true },
    countedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    claimedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CashbackReward", cashbackRewardSchema);
