const mongoose = require("mongoose");

const comboSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discountPercentage: { type: Number, default: 0 },
  image: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Combo", comboSchema);
