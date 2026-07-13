const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: String,
  icon: { type: String, default: "🍽️" },
  priority: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

categorySchema.index({ name: 1 });

module.exports = mongoose.model("Category", categorySchema);
