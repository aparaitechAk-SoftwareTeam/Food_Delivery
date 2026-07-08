const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const Food = require("../models/Food");
const Category = require("../models/Category");
const Combo = require("../models/Combo");
const Banner = require("../models/Banner");
const FeaturedSection = require("../models/FeaturedSection");
const Review = require("../models/Review");

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

// CATEGORIES CRUD
exports.getCategories = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { categories } = require("../config/mockDataStore");
    return res.json(categories);
  }
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { categories } = require("../config/mockDataStore");
    const newCat = {
      _id: `c-${categories.length + 1}`,
      id: `c-${categories.length + 1}`,
      name: req.body.name,
      image: req.body.image || "",
      icon: req.body.icon || "🍽️",
      priority: req.body.priority || 0,
      isVisible: req.body.isVisible !== false,
      createdAt: new Date(),
    };
    categories.push(newCat);
    return res.status(201).json(newCat);
  }
  try {
    const newCat = new Category(req.body);
    await newCat.save();
    res.status(201).json(newCat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { categories } = require("../config/mockDataStore");
    const idx = categories.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      categories[idx] = { ...categories[idx], ...req.body };
      return res.json(categories[idx]);
    }
    return res.status(404).json({ message: "Category not found" });
  }
  try {
    const updated = await Category.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { categories } = require("../config/mockDataStore");
    const idx = categories.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      const deleted = categories.splice(idx, 1);
      return res.json({ message: "Category deleted", deleted });
    }
    return res.status(404).json({ message: "Category not found" });
  }
  try {
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted", deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FOOD ITEMS CRUD
exports.getFoods = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    return res.json(foods);
  }
  try {
    const foods = await Food.find().populate("category restaurant").sort({ name: 1 });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createFood = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    const newFood = {
      _id: `f-${foods.length + 1}`,
      id: `f-${foods.length + 1}`,
      ...req.body,
      createdAt: new Date(),
    };
    foods.push(newFood);
    return res.status(201).json(newFood);
  }
  try {
    const newFood = new Food(req.body);
    await newFood.save();
    const populated = await Food.findById(newFood._id).populate("category restaurant");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFood = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    const idx = foods.findIndex(f => f._id === id || f.id === id);
    if (idx !== -1) {
      foods[idx] = { ...foods[idx], ...req.body };
      return res.json(foods[idx]);
    }
    return res.status(404).json({ message: "Food not found" });
  }
  try {
    const updated = await Food.findByIdAndUpdate(id, req.body, { new: true }).populate("category restaurant");
    if (!updated) return res.status(404).json({ message: "Food not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFood = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    const idx = foods.findIndex(f => f._id === id || f.id === id);
    if (idx !== -1) {
      const deleted = foods.splice(idx, 1);
      return res.json({ message: "Food deleted", deleted });
    }
    return res.status(404).json({ message: "Food not found" });
  }
  try {
    const deleted = await Food.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Food not found" });
    res.json({ message: "Food deleted", deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// COMBOS CRUD
exports.getCombos = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { combos } = require("../config/mockDataStore");
    return res.json(combos);
  }
  try {
    const combosList = await Combo.find().populate("items").sort({ name: 1 });
    res.json(combosList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCombo = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { combos, foods } = require("../config/mockDataStore");
    const itemsPopulated = (req.body.items || []).map(itemId => foods.find(f => f.id === itemId || f._id === itemId)).filter(Boolean);
    const newCombo = {
      _id: `combo-${combos.length + 1}`,
      id: `combo-${combos.length + 1}`,
      name: req.body.name,
      description: req.body.description || "",
      items: itemsPopulated,
      price: req.body.price,
      originalPrice: req.body.originalPrice || req.body.price,
      image: req.body.image || "",
      isActive: req.body.isActive !== false,
      createdAt: new Date(),
    };
    combos.push(newCombo);
    return res.status(201).json(newCombo);
  }
  try {
    const newCombo = new Combo(req.body);
    await newCombo.save();
    const populated = await Combo.findById(newCombo._id).populate("items");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCombo = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { combos, foods } = require("../config/mockDataStore");
    const idx = combos.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      const itemsPopulated = req.body.items 
        ? (req.body.items || []).map(itemId => foods.find(f => f.id === itemId || f._id === itemId)).filter(Boolean)
        : combos[idx].items;
      combos[idx] = { ...combos[idx], ...req.body, items: itemsPopulated };
      return res.json(combos[idx]);
    }
    return res.status(404).json({ message: "Combo not found" });
  }
  try {
    const updated = await Combo.findByIdAndUpdate(id, req.body, { new: true }).populate("items");
    if (!updated) return res.status(404).json({ message: "Combo not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCombo = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { combos } = require("../config/mockDataStore");
    const idx = combos.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      const deleted = combos.splice(idx, 1);
      return res.json({ message: "Combo deleted", deleted });
    }
    return res.status(404).json({ message: "Combo not found" });
  }
  try {
    const deleted = await Combo.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Combo not found" });
    res.json({ message: "Combo deleted", deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BANNERS CRUD
exports.getBanners = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { banners } = require("../config/mockDataStore");
    return res.json(banners);
  }
  try {
    const bannersList = await Banner.find().sort({ createdAt: -1 });
    res.json(bannersList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { banners } = require("../config/mockDataStore");
    const newBanner = {
      _id: `b-${banners.length + 1}`,
      id: `b-${banners.length + 1}`,
      title: req.body.title,
      description: req.body.description || "",
      image: req.body.image,
      cta: req.body.cta || "",
      isActive: req.body.isActive !== false,
      createdAt: new Date(),
    };
    banners.push(newBanner);
    return res.status(201).json(newBanner);
  }
  try {
    const newBanner = new Banner(req.body);
    await newBanner.save();
    res.status(201).json(newBanner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { banners } = require("../config/mockDataStore");
    const idx = banners.findIndex(b => b._id === id || b.id === id);
    if (idx !== -1) {
      banners[idx] = { ...banners[idx], ...req.body };
      return res.json(banners[idx]);
    }
    return res.status(404).json({ message: "Banner not found" });
  }
  try {
    const updated = await Banner.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Banner not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { banners } = require("../config/mockDataStore");
    const idx = banners.findIndex(b => b._id === id || b.id === id);
    if (idx !== -1) {
      const deleted = banners.splice(idx, 1);
      return res.json({ message: "Banner deleted", deleted });
    }
    return res.status(404).json({ message: "Banner not found" });
  }
  try {
    const deleted = await Banner.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Banner not found" });
    res.json({ message: "Banner deleted", deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FEATURED SECTIONS CRUD
exports.getSections = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { sections } = require("../config/mockDataStore");
    return res.json(sections);
  }
  try {
    const list = await FeaturedSection.find().populate("items").sort({ displayOrder: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSection = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { sections, foods } = require("../config/mockDataStore");
    const itemsPopulated = (req.body.items || []).map(itemId => foods.find(f => f.id === itemId || f._id === itemId)).filter(Boolean);
    const newSec = {
      _id: `sec-${sections.length + 1}`,
      id: `sec-${sections.length + 1}`,
      title: req.body.title,
      subtitle: req.body.subtitle || "",
      banner: req.body.banner || "",
      displayOrder: req.body.displayOrder || 0,
      maxItems: req.body.maxItems || 10,
      isVisible: req.body.isVisible !== false,
      items: itemsPopulated,
      createdAt: new Date(),
    };
    sections.push(newSec);
    return res.status(201).json(newSec);
  }
  try {
    const newSec = new FeaturedSection(req.body);
    await newSec.save();
    const populated = await FeaturedSection.findById(newSec._id).populate("items");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSection = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { sections, foods } = require("../config/mockDataStore");
    const idx = sections.findIndex(s => s._id === id || s.id === id);
    if (idx !== -1) {
      const itemsPopulated = req.body.items 
        ? (req.body.items || []).map(itemId => foods.find(f => f.id === itemId || f._id === itemId)).filter(Boolean)
        : sections[idx].items;
      sections[idx] = { ...sections[idx], ...req.body, items: itemsPopulated };
      return res.json(sections[idx]);
    }
    return res.status(404).json({ message: "Section not found" });
  }
  try {
    const updated = await FeaturedSection.findByIdAndUpdate(id, req.body, { new: true }).populate("items");
    if (!updated) return res.status(404).json({ message: "Section not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSection = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { sections } = require("../config/mockDataStore");
    const idx = sections.findIndex(s => s._id === id || s.id === id);
    if (idx !== -1) {
      const deleted = sections.splice(idx, 1);
      return res.json({ message: "Section deleted", deleted });
    }
    return res.status(404).json({ message: "Section not found" });
  }
  try {
    const deleted = await FeaturedSection.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Section not found" });
    res.json({ message: "Section deleted", deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BULK ACTIONS
exports.bulkUpload = async (req, res) => {
  const { type, items } = req.body;
  if (process.env.MOCK_DB === "true") {
    const { foods, categories } = require("../config/mockDataStore");
    const list = type === "categories" ? categories : foods;
    const prefix = type === "categories" ? "c-" : "f-";
    const uploaded = items.map((item, idx) => {
      const created = {
        _id: `${prefix}bulk-${list.length + idx + 1}`,
        id: `${prefix}bulk-${list.length + idx + 1}`,
        ...item,
        createdAt: new Date()
      };
      list.push(created);
      return created;
    });
    return res.status(201).json({ message: `Successfully imported ${uploaded.length} items.`, count: uploaded.length });
  }
  try {
    let result;
    if (type === "categories") {
      result = await Category.insertMany(items);
    } else {
      result = await Food.insertMany(items);
    }
    res.status(201).json({ message: `Successfully imported ${result.length} items.`, count: result.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkUpdate = async (req, res) => {
  const { ids, action, value } = req.body;
  if (process.env.MOCK_DB === "true") {
    const { foods } = require("../config/mockDataStore");
    let count = 0;
    ids.forEach(id => {
      const idx = foods.findIndex(f => f.id === id || f._id === id);
      if (idx !== -1) {
        count++;
        if (action === "disable") foods[idx].isAvailable = false;
        else if (action === "enable") foods[idx].isAvailable = true;
        else if (action === "delete") foods.splice(idx, 1);
        else if (action === "change_price") foods[idx].price = Number(value);
        else if (action === "change_category") foods[idx].category = value;
      }
    });
    return res.json({ message: `Successfully updated ${count} records.`, count });
  }
  try {
    let updateQuery = {};
    if (action === "disable") updateQuery = { isAvailable: false };
    else if (action === "enable") updateQuery = { isAvailable: true };
    else if (action === "change_price") updateQuery = { price: Number(value) };
    else if (action === "change_category") updateQuery = { category: value };

    if (action === "delete") {
      const result = await Food.deleteMany({ _id: { $in: ids } });
      return res.json({ message: `Successfully deleted ${result.deletedCount} items.`, count: result.deletedCount });
    }

    const result = await Food.updateMany({ _id: { $in: ids } }, { $set: updateQuery });
    res.json({ message: `Successfully updated ${result.modifiedCount} records.`, count: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRestaurantDetails = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { restaurants } = require("../config/mockDataStore");
    if (restaurants.length > 0) {
      restaurants[0] = { ...restaurants[0], ...req.body };
      return res.json(restaurants[0]);
    }
    return res.status(404).json({ message: "Restaurant not found" });
  }

  try {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      // If no restaurant exists (e.g. clean database), create one
      const newRest = await Restaurant.create({
        name: req.body.name || "FoodExpress Premium Kitchen",
        ...req.body
      });
      return res.json(newRest);
    }
    Object.assign(restaurant, req.body);
    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  if (process.env.MOCK_DB === "true") {
    const { orders } = require("../config/mockDataStore");
    const idx = orders.findIndex(o => o._id === id || o.id === id);
    if (idx !== -1) {
      const targetOrder = orders[idx];
      
      if (status && ["Delivered", "Completed", "Cancelled"].includes(targetOrder.status) && !["Delivered", "Completed", "Cancelled"].includes(status)) {
        return res.status(400).json({ message: "Cannot revert a finalized order (Delivered/Completed/Cancelled) to an active state." });
      }

      const targetStatus = status !== undefined ? status : targetOrder.status;
      const targetPaymentStatus = paymentStatus !== undefined ? paymentStatus : targetOrder.paymentStatus;
      
      if (targetStatus === "Completed" && targetPaymentStatus !== "Paid") {
        return res.status(400).json({ message: "Order cannot be completed until payment is confirmed." });
      }
      
      if (status) {
        targetOrder.status = status;
        targetOrder.orderStatus = status;
      }
      if (paymentStatus) targetOrder.paymentStatus = paymentStatus;
      if (status === "Completed") {
        targetOrder.completedAt = new Date();
        targetOrder.deliveryStatus = "Completed";
        targetOrder.riderStatus = "Completed";
      }
      return res.json(targetOrder);
    }
    return res.status(404).json({ message: "Order not found" });
  }

  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status && ["Delivered", "Completed", "Cancelled"].includes(order.status) && !["Delivered", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Cannot revert a finalized order (Delivered/Completed/Cancelled) to an active state." });
    }

    const finalStatus = status !== undefined ? status : order.status;
    const finalPaymentStatus = paymentStatus !== undefined ? paymentStatus : order.paymentStatus;

    if (finalStatus === "Completed" && finalPaymentStatus !== "Paid") {
      return res.status(400).json({ message: "Order cannot be completed until payment is confirmed." });
    }

    if (status) {
      order.status = status;
      order.orderStatus = status;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === "Paid") {
        order.paidAt = new Date();
        order.paymentReceivedAt = new Date();
      }
    }
    if (status === "Completed") {
      order.completedAt = new Date();
      order.deliveryStatus = "Completed";
      order.riderStatus = "Completed";
    }

    await order.save();
    
    const updated = await Order.findById(id).populate("user restaurant");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleBlockUser = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { users } = require("../config/mockDataStore");
    const idx = users.findIndex(u => u._id === id || u.id === id);
    if (idx !== -1) {
      users[idx].isBlocked = !users[idx].isBlocked;
      return res.json(users[idx]);
    }
    return res.status(404).json({ message: "User not found" });
  }
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReviews = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { reviews } = require("../config/mockDataStore");
    return res.json(reviews || []);
  }
  try {
    const reviews = await Review.find().populate("user", "name email").populate("food", "name").populate("restaurant", "name");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReviewStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (process.env.MOCK_DB === "true") {
    const { reviews } = require("../config/mockDataStore");
    const idx = reviews.findIndex(r => r._id === id || r.id === id);
    if (idx !== -1) {
      reviews[idx].status = status;
      return res.json(reviews[idx]);
    }
    return res.status(404).json({ message: "Review not found" });
  }
  try {
    const updated = await Review.findByIdAndUpdate(id, { status }, { new: true }).populate("user", "name email").populate("food", "name");
    if (!updated) return res.status(404).json({ message: "Review not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  const { id } = req.params;
  if (process.env.MOCK_DB === "true") {
    const { reviews } = require("../config/mockDataStore");
    const idx = reviews.findIndex(r => r._id === id || r.id === id);
    if (idx !== -1) {
      const deleted = reviews.splice(idx, 1);
      return res.json({ message: "Review deleted", deleted });
    }
    return res.status(404).json({ message: "Review not found" });
  }
  try {
    const deleted = await Review.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review deleted", deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Delivery Boy Management ───────────────────────────────────────────────────

exports.getDeliveryBoys = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { users } = require("../config/mockDataStore");
    const riders = users.filter(u => u.role === "delivery");
    return res.json(riders);
  }
  try {
    const riders = await User.find({ role: "delivery" }).select("-password");
    res.json(riders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDeliveryBoy = async (req, res) => {
  const { name, email, password, phone, vehicleType, vehicleNumber, licenseNumber, profilePhoto } = req.body;
  
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const bcrypt = require("bcryptjs");
    const hashed = await bcrypt.hash(password, 10);

    const rider = await User.create({
      name,
      email,
      password: hashed,
      phone,
      role: "delivery",
      vehicleType,
      vehicleNumber,
      licenseNumber,
      profilePhoto: profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    });

    // Strip password in response
    const result = rider.toObject();
    delete result.password;

    res.status(201).json(result);
  } catch (error) {
    res.status(550).json({ message: error.message });
  }
};

exports.updateDeliveryBoy = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, vehicleType, vehicleNumber, licenseNumber, profilePhoto, isBlocked } = req.body;

  try {
    const rider = await User.findOne({ _id: id, role: "delivery" });
    if (!rider) {
      return res.status(404).json({ message: "Delivery boy not found" });
    }

    if (name) rider.name = name;
    if (email) rider.email = email;
    if (phone) rider.phone = phone;
    if (vehicleType) rider.vehicleType = vehicleType;
    if (vehicleNumber) rider.vehicleNumber = vehicleNumber;
    if (licenseNumber) rider.licenseNumber = licenseNumber;
    if (profilePhoto) rider.profilePhoto = profilePhoto;
    if (isBlocked !== undefined) rider.isBlocked = isBlocked;

    await rider.save();
    
    const result = rider.toObject();
    delete result.password;

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDeliveryBoy = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await User.findOneAndDelete({ _id: id, role: "delivery" });
    if (!deleted) {
      return res.status(404).json({ message: "Delivery boy not found" });
    }
    res.json({ message: "Delivery boy deleted successfully", deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignOrderToRider = async (req, res) => {
  const { riderId } = req.body;
  const orderId = req.params.id;

  if (process.env.MOCK_DB === "true") {
    const { orders, users } = require("../config/mockDataStore");
    const idx = orders.findIndex(o => o._id === orderId || o.id === orderId);
    if (idx === -1) {
      return res.status(404).json({ message: "Order not found" });
    }
    const rider = users.find(u => (u._id === riderId || u.id === riderId) && u.role === "delivery");
    if (!rider) {
      return res.status(400).json({ message: "Invalid delivery boy selected" });
    }
    
    const targetOrder = orders[idx];
    targetOrder.deliveryBoy = rider;
    targetOrder.deliveryStatus = "Assigned";
    targetOrder.riderStatus = "Assigned";
    if (targetOrder.status === "Pending" || targetOrder.status === "Confirmed") {
      targetOrder.status = "Confirmed";
      targetOrder.orderStatus = "Confirmed";
    }
    return res.json({ message: "Order assigned to delivery rider", order: targetOrder });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const rider = await User.findOne({ _id: riderId, role: "delivery" });
    if (!rider) {
      return res.status(400).json({ message: "Invalid delivery boy selected" });
    }

    order.deliveryBoy = riderId;
    order.deliveryStatus = "Assigned";
    // Keep overall status Preparing or similar when assigned
    if (order.status === "Pending" || order.status === "Confirmed") {
      order.status = "Confirmed";
    }

    await order.save();
    res.json({ message: "Order assigned to delivery rider", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
