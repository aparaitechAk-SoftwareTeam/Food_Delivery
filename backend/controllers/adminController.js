const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const Food = require("../models/Food");
const Category = require("../models/Category");
const Combo = require("../models/Combo");
const Banner = require("../models/Banner");
const FeaturedSection = require("../models/FeaturedSection");

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
