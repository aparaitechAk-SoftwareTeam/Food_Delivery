const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: { type: String, required: true },
  cta: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  type: { type: String, default: "promo" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Banner", bannerSchema);
