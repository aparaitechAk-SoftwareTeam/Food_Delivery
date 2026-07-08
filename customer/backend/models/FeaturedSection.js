const mongoose = require("mongoose");

const featuredSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  banner: String,
  displayOrder: { type: Number, default: 0 },
  maxItems: { type: Number, default: 10 },
  isVisible: { type: Boolean, default: true },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FeaturedSection", featuredSectionSchema);
