const Cart = require("../models/Cart");

exports.getCart = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { carts } = require("../config/mockDataStore");
    const userId = (req.user.id || req.user._id).toString();
    if (!carts[userId]) {
      carts[userId] = [];
    }
    return res.json({ items: carts[userId] });
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.food");
  res.json(cart || { items: [] });
};

exports.updateCart = async (req, res) => {
  const { items } = req.body;

  if (process.env.MOCK_DB === "true") {
    const { carts, foods } = require("../config/mockDataStore");
    const userId = (req.user.id || req.user._id).toString();
    
    // Resolve the food IDs into complete food objects
    const resolvedItems = items.map(item => {
      const foodId = typeof item.food === "object" ? (item.food.id || item.food._id) : item.food;
      const foodItem = foods.find(f => f.id === foodId || f._id === foodId);
      return {
        food: foodItem || { id: foodId, name: "Food Item" },
        quantity: item.quantity
      };
    });
    
    carts[userId] = resolvedItems;
    return res.json({ items: resolvedItems });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items });
  } else {
    cart.items = items;
    cart.updatedAt = Date.now();
    await cart.save();
  }
  const populated = await cart.populate("items.food");
  res.json(populated);
};

exports.clearCart = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { carts } = require("../config/mockDataStore");
    const userId = (req.user.id || req.user._id).toString();
    carts[userId] = [];
    return res.json({ message: "Cart cleared" });
  }

  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ message: "Cart cleared" });
};
