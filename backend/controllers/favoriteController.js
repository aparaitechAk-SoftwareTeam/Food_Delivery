const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

// Get user's favorite restaurants
exports.getFavorites = async (req, res) => {
  const user = await User.findById(req.user._id).populate("favorites");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json(user.favorites || []);
};

// Toggle a restaurant in favorites (add or remove)
exports.toggleFavorite = async (req, res) => {
  const { restaurantId } = req.body;
  if (!restaurantId) {
    res.status(400);
    throw new Error("Restaurant ID is required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isFavorite = user.favorites.includes(restaurantId);

  if (isFavorite) {
    // Remove from favorites
    user.favorites = user.favorites.filter(
      (fav) => fav.toString() !== restaurantId.toString()
    );
  } else {
    // Add to favorites
    user.favorites.push(restaurantId);
  }

  await user.save();
  
  // Return the updated favorites populated
  const updatedUser = await User.findById(req.user._id).populate("favorites");
  res.json({
    message: isFavorite ? "Removed from favorites" : "Added to favorites",
    favorites: updatedUser.favorites,
  });
};
