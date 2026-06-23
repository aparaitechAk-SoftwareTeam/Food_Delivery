const Order = require("../models/Order");

exports.createOrder = async (req, res) => {
  const { items, address, paymentMethod, totalAmount } = req.body;
  const order = await Order.create({
    user: req.user._id,
    items,
    address,
    paymentMethod,
    totalAmount,
    orderNumber: `ORD-${Date.now()}`,
  });
  res.status(201).json(order);
};

exports.getOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  const current = orders.filter(
    (order) => order.status !== "Delivered" && order.status !== "Cancelled",
  );
  const history = orders.filter(
    (order) => order.status === "Delivered" || order.status === "Cancelled",
  );
  res.json({ current, history });
};
