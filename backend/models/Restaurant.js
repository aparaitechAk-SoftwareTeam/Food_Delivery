const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  rating: { type: Number, default: 0 },
  deliveryTime: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
