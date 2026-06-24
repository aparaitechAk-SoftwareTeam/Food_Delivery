const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  rating: { type: Number, default: 0 },
  deliveryTime: { type: String, default: "25-35 mins" },
  image: String,
  reviewCount: { type: Number, default: 0 },
  distance: { type: Number, default: 1.0 },
  cuisine: [{ type: String }],
  offerPercentage: { type: Number, default: 0 },
  vegType: { type: String, enum: ["veg", "non-veg", "both"], default: "both" },
  isOpen: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  restaurantType: {
    type: String,
    enum: ["Pure Veg", "Multi Cuisine", "Cafe", "Bakery", "Cloud Kitchen"],
    default: "Multi Cuisine",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
