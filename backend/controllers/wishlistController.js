const Wishlist = require("../models/Wishlist");
const Food = require("../models/Food");

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    if (process.env.MOCK_DB === "true") {
      const { wishlists } = require("../config/mockDataStore");
      if (!wishlists[userId]) {
        wishlists[userId] = [];
      }
      return res.json({ foodItems: wishlists[userId] });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: "foodItems",
      populate: { path: "restaurant" }
    });
    res.json(wishlist || { foodItems: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const foodId = req.body.productId || req.body.foodId;
    if (!foodId) {
      return res.status(400).json({ message: "Food ID or Product ID is required" });
    }

    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({ message: "Invalid Food ID format" });
    }

    const userId = req.user._id.toString();
    if (process.env.MOCK_DB === "true") {
      const { wishlists, foods } = require("../config/mockDataStore");
      if (!wishlists[userId]) {
        wishlists[userId] = [];
      }
      // Check if food already in wishlist
      const alreadyIn = wishlists[userId].find(item => item._id === foodId || item.id === foodId);
      if (alreadyIn) {
        return res.json({ foodItems: wishlists[userId] });
      }
      // Find food in mock foods
      const foodItem = foods.find(f => f._id === foodId || f.id === foodId);
      if (!foodItem) {
        return res.status(404).json({ message: "Food item not found" });
      }
      wishlists[userId].push(foodItem);
      return res.json({ foodItems: wishlists[userId] });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, foodItems: [foodId] });
    } else {
      if (!wishlist.foodItems.includes(foodId)) {
        wishlist.foodItems.push(foodId);
        await wishlist.save();
      }
    }
    const populated = await wishlist.populate({
      path: "foodItems",
      populate: { path: "restaurant" }
    });
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { foodId } = req.params;
    if (!foodId) {
      return res.status(400).json({ message: "Food ID is required" });
    }

    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({ message: "Invalid Food ID format" });
    }

    const userId = req.user._id.toString();
    if (process.env.MOCK_DB === "true") {
      const { wishlists } = require("../config/mockDataStore");
      if (wishlists[userId]) {
        wishlists[userId] = wishlists[userId].filter(
          item => item._id !== foodId && item.id !== foodId
        );
      }
      return res.json({ foodItems: wishlists[userId] || [] });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.foodItems = wishlist.foodItems.filter(id => id.toString() !== foodId);
      await wishlist.save();
    }
    
    if (wishlist) {
      const populated = await wishlist.populate({
        path: "foodItems",
        populate: { path: "restaurant" }
      });
      return res.json(populated);
    }
    res.json({ foodItems: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
