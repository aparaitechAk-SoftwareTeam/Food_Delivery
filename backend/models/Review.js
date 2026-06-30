const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  food: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  rating: { type: Number, required: true },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", reviewSchema);
