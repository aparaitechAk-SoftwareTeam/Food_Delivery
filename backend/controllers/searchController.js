const Restaurant = require("../models/Restaurant");
const Food = require("../models/Food");
const Category = require("../models/Category");

// Unified search for restaurants, foods, and categories
exports.searchAll = async (req, res) => {
  const query = req.query.q || "";
  if (!query.trim()) {
    return res.json({
      restaurants: [],
      foods: [],
      categories: [],
    });
  }

  const regex = new RegExp(query, "i");

  try {
    // Search Restaurants matching name or address/description (or we can just match name)
    const restaurants = await Restaurant.find({
      $or: [{ name: regex }],
    });

    // Search Foods matching name or description
    const foods = await Food.find({
      $or: [{ name: regex }, { description: regex }],
    }).populate("restaurant category");

    // Search Categories matching name
    const categories = await Category.find({
      name: regex,
    });

    res.json({
      restaurants,
      foods,
      categories,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Search failed: " + error.message);
  }
};
