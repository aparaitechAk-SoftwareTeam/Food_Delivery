const Wishlist = require("../models/Wishlist");

exports.getWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
    "foodItems",
  );
  res.json(wishlist || { foodItems: [] });
};

exports.updateWishlist = async (req, res) => {
  const { foodItems } = req.body;
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, foodItems });
  } else {
    wishlist.foodItems = foodItems;
    await wishlist.save();
  }
  res.json(wishlist);
};
