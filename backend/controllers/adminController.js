const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");

exports.getDashboardStats = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { users, restaurants, orders, offers } = require("../config/mockDataStore");
    const totalUsers = users.length;
    const totalRestaurants = restaurants.length;
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + (o.status === "Delivered" ? o.totalAmount : 0), 0);
    const activeCoupons = offers.length;
    return res.json({
      totalUsers,
      totalRestaurants,
      totalOrders,
      revenue,
      activeCoupons,
      avgOrderValue: totalOrders > 0 ? parseFloat((revenue / totalOrders).toFixed(2)) : 0
    });
  }

  try {
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ active: true });
    
    const deliveredOrders = await Order.find({ status: "Delivered" });
    const revenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      totalUsers,
      totalRestaurants,
      totalOrders,
      revenue,
      activeCoupons,
      avgOrderValue: totalOrders > 0 ? parseFloat((revenue / totalOrders).toFixed(2)) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsersList = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { users } = require("../config/mockDataStore");
    return res.json(users);
  }
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRestaurantsList = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { restaurants } = require("../config/mockDataStore");
    return res.json(restaurants);
  }
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrdersList = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { orders } = require("../config/mockDataStore");
    return res.json(orders);
  }
  try {
    const orders = await Order.find().populate("user").populate("restaurant");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenueAnalytics = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { orders } = require("../config/mockDataStore");
    const monthly = {
      "Jan": 12500, "Feb": 15400, "Mar": 18900, "Apr": 22000, "May": 25000, "Jun": 32000
    };
    return res.json(monthly);
  }
  try {
    const monthlyRevenue = await Order.aggregate([
      { $match: { status: "Delivered" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    res.json(monthlyRevenue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
