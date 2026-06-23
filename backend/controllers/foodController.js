const Food = require("../models/Food");
const Category = require("../models/Category");

exports.getFoods = async (req, res) => {
  const foods = await Food.find().populate("category restaurant");
  const categories = await Category.find();
  const featured = foods.filter((item) => item.isFeatured);
  const popular = foods.filter((item) => item.isPopular);
  res.json({ foods, categories, featured, popular });
};

exports.getFoodById = async (req, res) => {
  const food = await Food.findById(req.params.id).populate(
    "category restaurant reviews",
  );
  if (!food) {
    res.status(404);
    throw new Error("Food not found");
  }
  res.json(food);
};
