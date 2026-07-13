const Cart = require("../models/Cart");

exports.getCart = async (req, res) => {
  

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.food");
  res.json(cart || { items: [] });
};

exports.updateCart = async (req, res) => {
  const { items } = req.body;

  

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
  

  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ message: "Cart cleared" });
};
