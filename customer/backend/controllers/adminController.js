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
const CashbackReward = require("../models/CashbackReward");
const CashbackCampaign = require("../models/CashbackCampaign");
const MembershipPlan = require("../models/MembershipPlan");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "foodexpress_jwt_fallback_secret_key_12345", { expiresIn: "7d" });

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const admin = await Admin.findOne({ email });
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!admin.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated");
  }

  res.json({
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    token: generateToken(admin._id),
  });
};

exports.adminLogout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

exports.getAdminProfile = async (req, res) => {
  res.json({
    admin: {
      id: req.user.id || req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    }
  });
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ active: true });
    
    const validOrders = await Order.find({ status: { $ne: "Cancelled" } });
    const revenue = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const deliveredOrders = validOrders.filter((o) =>
      ["Delivered", "Completed"].includes(o.status) || 
      ["Delivered", "Completed"].includes(o.deliveryStatus) ||
      ["Delivered", "Completed"].includes(o.riderStatus) ||
      ["Delivered", "Completed"].includes(o.orderStatus)
    );
    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const driverCut = deliveredOrders.reduce((sum, o) => sum + (o.deliveryCharge || 40), 0);

    res.json({
      totalUsers,
      totalRestaurants,
      totalOrders,
      revenue,
      deliveredRevenue,
      driverCut,
      netRevenue: revenue - driverCut,
      activeCoupons,
      avgOrderValue: totalOrders > 0 ? parseFloat((revenue / totalOrders).toFixed(2)) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsersList = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRestaurantsList = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrdersList = async (req, res) => {
  try {
    const { range, status, search, includeStats } = req.query;

    const query = {};

    // Calculate Date Range Boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);

    const sevenDaysStart = new Date(todayStart);
    sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);

    const thirtyDaysStart = new Date(todayStart);
    thirtyDaysStart.setDate(thirtyDaysStart.getDate() - 29);

    if (range === "today") {
      query.createdAt = { $gte: todayStart, $lte: todayEnd };
    } else if (range === "yesterday") {
      query.createdAt = { $gte: yesterdayStart, $lte: yesterdayEnd };
    } else if (range === "7days") {
      query.createdAt = { $gte: sevenDaysStart };
    } else if (range === "30days") {
      query.createdAt = { $gte: thirtyDaysStart };
    }

    if (status && status !== "All") {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("user", "name phone email")
      .populate("restaurant", "name address")
      .populate("deliveryBoy", "name phone email vehicleType vehicleNumber")
      .sort({ createdAt: -1 });

    let stats = null;
    if (includeStats === "true" || range) {
      const [todayCount, yesterdayCount, sevenDaysCount, thirtyDaysCount, totalCount] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
        Order.countDocuments({ createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
        Order.countDocuments({ createdAt: { $gte: sevenDaysStart } }),
        Order.countDocuments({ createdAt: { $gte: thirtyDaysStart } }),
        Order.countDocuments({}),
      ]);

      stats = {
        todayCount,
        yesterdayCount,
        sevenDaysCount,
        thirtyDaysCount,
        totalCount,
      };
    }

    if (includeStats === "true") {
      return res.json({ orders, stats });
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenueAnalytics = async (req, res) => {
  try {
    const monthlyRevenue = await Order.aggregate([
      { 
        $match: { 
          $or: [
            { status: { $in: ["Delivered", "Completed"] } },
            { deliveryStatus: { $in: ["Delivered", "Completed"] } },
            { riderStatus: { $in: ["Delivered", "Completed"] } },
            { orderStatus: { $in: ["Delivered", "Completed"] } }
          ]
        } 
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" },
          driverCut: { $sum: { $ifNull: ["$deliveryCharge", 40] } }
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
  
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  
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
  
  try {
    const foods = await Food.find().populate("category restaurant").sort({ name: 1 });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createFood = async (req, res) => {
  try {
    if (req.body.category === "") req.body.category = null;
    if (req.body.restaurant === "") req.body.restaurant = null;
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
  
  try {
    if (req.body.category === "") req.body.category = null;
    if (req.body.restaurant === "") req.body.restaurant = null;
    const updated = await Food.findByIdAndUpdate(id, req.body, { new: true }).populate("category restaurant");
    if (!updated) return res.status(404).json({ message: "Food not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFood = async (req, res) => {
  const { id } = req.params;
  
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
  
  try {
    const combosList = await Combo.find().populate("items").sort({ name: 1 });
    res.json(combosList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to sync Combo to a shadow Food document
const syncComboToFood = async (combo) => {
  const Food = require("../models/Food");
  try {
    const firstRest = combo.items && combo.items.length > 0
      ? (await Food.findById(combo.items[0]).select("restaurant"))?.restaurant
      : null;

    const foodPayload = {
      name: combo.name,
      description: combo.description || "Curated meal combo with discount savings.",
      price: combo.price,
      originalPrice: combo.originalPrice || combo.price,
      image: combo.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
      isCombo: true,
      isAvailable: combo.isActive !== false,
      rating: 4.8,
      preparationTime: 25,
      restaurant: firstRest
    };

    await Food.findByIdAndUpdate(
      combo._id,
      { $set: foodPayload },
      { upsert: true, new: true }
    );
    console.log(`[syncComboToFood] Synced combo '${combo.name}' to Food collection.`);
  } catch (err) {
    console.error("[syncComboToFood] Error syncing combo:", err.message);
  }
};

exports.createCombo = async (req, res) => {
  try {
    const newCombo = new Combo(req.body);
    await newCombo.save();
    const populated = await Combo.findById(newCombo._id).populate("items");
    await syncComboToFood(populated);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCombo = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await Combo.findByIdAndUpdate(id, req.body, { new: true }).populate("items");
    if (!updated) return res.status(404).json({ message: "Combo not found" });
    await syncComboToFood(updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCombo = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Combo.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Combo not found" });
    
    // Also delete shadow food
    const Food = require("../models/Food");
    await Food.findByIdAndDelete(id);
    
    res.json({ message: "Combo deleted", deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BANNERS CRUD
exports.getBanners = async (req, res) => {
  
  try {
    const bannersList = await Banner.find().populate("foods").sort({ createdAt: -1 });
    res.json(bannersList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  
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
  
  try {
    const list = await FeaturedSection.find().populate("items").sort({ displayOrder: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSection = async (req, res) => {
  
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

    // If cashback settings are updated, sync all user rewards directly in the database
    if (req.body.cashbackAmount !== undefined || req.body.cashbackRequiredOrders !== undefined) {
      const CashbackReward = require("../models/CashbackReward");
      const currentRequired = Number(req.body.cashbackRequiredOrders) || restaurant.cashbackRequiredOrders || 4;
      const currentAmount = Number(req.body.cashbackAmount) || restaurant.cashbackAmount || 150;

      // Update all rewards in database
      const rewards = await CashbackReward.find();
      for (const reward of rewards) {
        let changed = false;
        if (reward.totalRequiredOrders !== currentRequired) {
          reward.totalRequiredOrders = currentRequired;
          changed = true;
        }
        if (reward.cashbackAmount !== currentAmount) {
          reward.cashbackAmount = currentAmount;
          changed = true;
        }

        // Clamp completed orders if required orders decreased
        if (reward.completedOrders > reward.totalRequiredOrders) {
          reward.completedOrders = reward.totalRequiredOrders;
          changed = true;
        }

        // Re-evaluate eligibility for active rewards
        if (reward.status === "Pending" || reward.status === "Eligible") {
          if (reward.completedOrders >= reward.totalRequiredOrders) {
            reward.status = "Eligible";
          } else {
            reward.status = "Pending";
          }
          changed = true;
        } else if (reward.status === "Claimed") {
          if (reward.completedOrders !== reward.totalRequiredOrders) {
            reward.completedOrders = reward.totalRequiredOrders;
            changed = true;
          }
        }

        if (changed) {
          await reward.save();
        }
      }
      console.log(`[AdminController] Automatically updated reward configurations for ${rewards.length} users.`);
    }

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  

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
    
    if (status === "Delivered") {
      const cashbackService = require("../services/cashbackService");
      await cashbackService.handleOrderDelivered(order);
    }

    const { emitOrderUpdate } = require("../config/socket");
    let eventName = "order-status-updated";
    if (status === "Cancelled") eventName = "delivery-cancelled";
    else if (status === "Delivered") eventName = "delivery-completed";
    await emitOrderUpdate(id, eventName);
    
    const updated = await Order.findById(id).populate("user restaurant deliveryBoy");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleBlockUser = async (req, res) => {
  const { id } = req.params;
  
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
  try {
    const reviewController = require("./reviewController");
    await reviewController.getAllReviewsAdmin(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReviewStatus = async (req, res) => {
  try {
    const reviewController = require("./reviewController");
    await reviewController.updateStatus(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const reviewController = require("./reviewController");
    await reviewController.deleteReview(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ── Delivery Boy Management ───────────────────────────────────────────────────

exports.getDeliveryBoys = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const riders = await User.find({ role: "delivery" }).select("-password").lean();
    const riderIds = riders.map((r) => r._id);

    const objectRiderIds = riderIds.map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id));
    const stringRiderIds = riderIds.map((id) => id.toString());
    
    const orders = await Order.find({
      $or: [
        { deliveryBoy: { $in: objectRiderIds } },
        { deliveryBoy: { $in: stringRiderIds } }
      ]
    }).select("deliveryBoy totalAmount deliveryCharge paymentMethod status deliveryStatus riderStatus orderStatus createdAt");

    const statsMap = {};
    riderIds.forEach((id) => {
      statsMap[id.toString()] = {
        completedCount: 0,
        totalEarnings: 0,
        cashCollected: 0,
        onlineEarnings: 0,
        activeCount: 0,
      };
    });

    orders.forEach((o) => {
      if (!o.deliveryBoy) return;
      const rId = o.deliveryBoy.toString();
      if (!statsMap[rId]) return;

      const isCompleted = ["Delivered", "Completed"].includes(o.status) || 
                          ["Delivered", "Completed"].includes(o.deliveryStatus) ||
                          ["Delivered", "Completed"].includes(o.riderStatus) ||
                          ["Delivered", "Completed"].includes(o.orderStatus);

      const isActive = ["Assigned", "Accepted", "Arrived At Restaurant", "Picked Up"].includes(o.deliveryStatus) ||
                       ["Assigned", "Accepted", "Arrived At Restaurant", "Picked Up"].includes(o.status);
      
      if (isCompleted) {
        statsMap[rId].completedCount += 1;
        statsMap[rId].totalEarnings += o.deliveryCharge || 40;
        
        const isCOD = !o.paymentMethod || o.paymentMethod.toLowerCase().includes("cash") || o.paymentMethod.toUpperCase() === "COD";
        if (isCOD) {
          statsMap[rId].cashCollected += o.totalAmount || 0;
        } else {
          statsMap[rId].onlineEarnings += o.totalAmount || 0;
        }
      } else if (isActive) {
        statsMap[rId].activeCount += 1;
      }
    });

    const enrichedRiders = riders.map((r) => {
      const s = statsMap[r._id.toString()] || {
        completedCount: 0,
        totalEarnings: 0,
        cashCollected: 0,
        onlineEarnings: 0,
        activeCount: 0,
      };
      return {
        ...r,
        completedCount: s.completedCount,
        totalEarnings: s.totalEarnings,
        cashCollected: s.cashCollected,
        onlineEarnings: s.onlineEarnings,
        activeCount: s.activeCount,
      };
    });

    res.json(enrichedRiders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeliveryBoyHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const mongoose = require("mongoose");
    const rider = await User.findOne({ _id: id, role: "delivery" }).select("-password");
    if (!rider) {
      return res.status(404).json({ message: "Delivery rider not found" });
    }

    const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

    const orders = await Order.find({
      $or: [
        { deliveryBoy: id },
        { deliveryBoy: objectId }
      ]
    })
      .populate("user", "name phone email")
      .populate("restaurant", "name address")
      .populate("items.food", "name image price")
      .sort({ createdAt: -1 });

    let completedCount = 0;
    let cancelledCount = 0;
    let totalEarnings = 0;
    let cashCollected = 0;
    let onlineEarnings = 0;

    orders.forEach((o) => {
      const isCompleted = ["Delivered", "Completed"].includes(o.status) || 
                          ["Delivered", "Completed"].includes(o.deliveryStatus) ||
                          ["Delivered", "Completed"].includes(o.riderStatus) ||
                          ["Delivered", "Completed"].includes(o.orderStatus);

      if (isCompleted) {
        completedCount += 1;
        totalEarnings += o.deliveryCharge || 40;
        const isCOD = !o.paymentMethod || o.paymentMethod.toLowerCase().includes("cash") || o.paymentMethod.toUpperCase() === "COD";
        if (isCOD) {
          cashCollected += o.totalAmount || 0;
        } else {
          onlineEarnings += o.totalAmount || 0;
        }
      } else if (o.status === "Cancelled" || o.deliveryStatus === "Cancelled") {
        cancelledCount += 1;
      }
    });

    res.json({
      rider,
      summary: {
        totalOrders: orders.length,
        completedCount,
        cancelledCount,
        totalEarnings,
        cashCollected,
        onlineEarnings,
      },
      orders,
    });
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
    
    const { emitOrderUpdate } = require("../config/socket");
    await emitOrderUpdate(orderId, "delivery-assigned");

    const populatedOrder = await Order.findById(orderId).populate("user restaurant deliveryBoy");
    res.json({ message: "Order assigned to delivery rider", order: populatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRewardsList = async (req, res) => {
  try {
    const { status, search } = req.query;
    const now = new Date();

    // Auto-expire rewards in the database whose expiry dates have passed
    await CashbackReward.updateMany(
      {
        status: { $in: ["Pending", "Eligible"] },
        expiryDate: { $lt: now },
      },
      {
        $set: { status: "Expired" },
      }
    );

    let query = {};
    if (status && status !== "All") {
      query.status = status;
    }

    let rewards = await CashbackReward.find(query)
      .populate("userId", "name email createdAt walletBalance")
      .sort({ createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      rewards = rewards.filter((reward) => {
        const userName = reward.userId?.name?.toLowerCase() || "";
        const userEmail = reward.userId?.email?.toLowerCase() || "";
        return userName.includes(searchLower) || userEmail.includes(searchLower);
      });
    }

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rewards: " + error.message });
  }
};

// --- Cashback Campaign CRUD ---
exports.getCampaigns = async (req, res) => {
  try {
    const list = await CashbackCampaign.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch campaigns: " + error.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const { title, category, cashbackPercentage, cashbackCap, expiryDate, isActive } = req.body;
    if (!title || !category || !cashbackPercentage || !cashbackCap || !expiryDate) {
      return res.status(400).json({ message: "All campaign fields are required" });
    }

    const campaign = await CashbackCampaign.create({
      title,
      category,
      cashbackPercentage,
      cashbackCap,
      expiryDate,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Failed to create campaign: " + error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CashbackCampaign.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete campaign: " + error.message });
  }
};

// --- Membership Plan CRUD ---
exports.getPlansList = async (req, res) => {
  try {
    const list = await MembershipPlan.find().sort({ price: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch membership plans: " + error.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { name, price, durationDays, description } = req.body;
    if (!name || !price || !durationDays || !description) {
      return res.status(400).json({ message: "All membership plan fields are required" });
    }

    const plan = await MembershipPlan.create({
      name,
      price,
      durationDays,
      description,
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: "Failed to create membership plan: " + error.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MembershipPlan.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Membership plan not found" });
    }
    res.json({ message: "Membership plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete membership plan: " + error.message });
  }
};

exports.getCouponsList = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Auto-expire active coupons
    await Coupon.updateMany(
      { status: "Active", expiresAt: { $lt: new Date() } },
      { $set: { status: "Expired" } }
    );

    let query = {};
    if (status && status !== "All") {
      query.status = status;
    }

    let coupons = await Coupon.find(query)
      .populate("userId", "name email")
      .populate("orderId", "orderNumber totalAmount createdAt")
      .sort({ createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      coupons = coupons.filter(c => {
        const userName = c.userId?.name?.toLowerCase() || "";
        const userEmail = c.userId?.email?.toLowerCase() || "";
        const code = c.code.toLowerCase();
        return userName.includes(searchLower) || userEmail.includes(searchLower) || code.includes(searchLower);
      });
    }

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch coupons list: " + error.message });
  }
};

exports.updateCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Used", "Expired", "Disabled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status option" });
    }

    const updateFields = {};
    if (status === "Disabled") {
      updateFields.active = false;
    } else {
      updateFields.status = status;
      if (status === "Active") updateFields.active = true;
    }

    const coupon = await Coupon.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json({ message: "Coupon status updated successfully", coupon });
  } catch (error) {
    res.status(500).json({ message: "Failed to update coupon: " + error.message });
  }
};

// ─── Cuisine Management ───────────────────────────────────────────────────────
const Cuisine = require("../models/Cuisine");

const DEFAULT_CUISINES = [
  "Italian", "North Indian", "South Indian", "Chinese",
  "Continental", "Mexican", "Fast Food", "Desserts"
];

exports.getCuisines = async (req, res) => {
  try {
    // Seed defaults if collection is empty
    const count = await Cuisine.countDocuments();
    if (count === 0) {
      await Cuisine.insertMany(DEFAULT_CUISINES.map(name => ({ name })));
    }
    const cuisines = await Cuisine.find({}).sort({ name: 1 });
    res.json(cuisines);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cuisines: " + error.message });
  }
};

exports.createCuisine = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Cuisine name is required" });
    }
    const exists = await Cuisine.findOne({ name: new RegExp(`^${name.trim()}$`, "i") });
    if (exists) {
      return res.status(400).json({ message: "Cuisine already exists" });
    }
    const cuisine = await Cuisine.create({ name: name.trim() });
    res.status(201).json(cuisine);
  } catch (error) {
    res.status(500).json({ message: "Failed to create cuisine: " + error.message });
  }
};

exports.deleteCuisine = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Cuisine.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Cuisine not found" });
    res.json({ message: "Cuisine deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete cuisine: " + error.message });
  }
};

// ─── Tag Management ───────────────────────────────────────────────────────────
const Tag = require("../models/Tag");

const DEFAULT_TAGS = [
  "New", "Trending", "Bestseller", "Healthy", "High Protein",
  "Low Calorie", "Sugar Free", "Combo", "Recommended",
  "Chef Choice", "Hot", "Cold", "Seasonal"
];

exports.getTags = async (req, res) => {
  try {
    const count = await Tag.countDocuments();
    if (count === 0) {
      await Tag.insertMany(DEFAULT_TAGS.map(name => ({ name })));
    }
    const tags = await Tag.find({}).sort({ name: 1 });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tags: " + error.message });
  }
};

exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tag name is required" });
    }
    const exists = await Tag.findOne({ name: new RegExp(`^${name.trim()}$`, "i") });
    if (exists) {
      return res.status(400).json({ message: "Tag already exists" });
    }
    const tag = await Tag.create({ name: name.trim() });
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ message: "Failed to create tag: " + error.message });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Tag.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Tag not found" });
    res.json({ message: "Tag deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete tag: " + error.message });
  }
};




