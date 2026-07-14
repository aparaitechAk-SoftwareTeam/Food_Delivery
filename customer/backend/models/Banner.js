const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subtitle: String,
  image: { type: String, required: true },
  cta: String,
  redirectType: { type: String, enum: ['Restaurant', 'Category', 'Offer', 'External Link', 'None'], default: 'None' },
  redirectValue: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  type: { type: String, default: "promo" },
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Banner", bannerSchema);
