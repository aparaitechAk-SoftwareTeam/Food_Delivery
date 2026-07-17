const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  food: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  comment: String, // Acts as the description
  images: [{ type: String }],
  status: { type: String, enum: ["Pending", "Approved", "Hidden"], default: "Approved" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", reviewSchema);
