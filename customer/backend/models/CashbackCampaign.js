const mongoose = require("mongoose");

const cashbackCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true }, // e.g. "Beverages", "Dessert", or "All"
    cashbackPercentage: { type: Number, required: true }, // e.g. 10 for 10%
    cashbackCap: { type: Number, required: true }, // e.g. 50 for max ₹50
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CashbackCampaign", cashbackCampaignSchema);
