const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discountPercentage: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  image: String,
  rating: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  isFeatured: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  preparationTime: { type: Number, default: 20 }, // in minutes
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  popularityScore: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Food", foodSchema);
