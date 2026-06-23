const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  foodItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Wishlist", wishlistSchema);
