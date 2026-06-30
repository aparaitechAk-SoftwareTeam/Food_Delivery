const express = require("express");
const {
  getDashboardStats,
  getUsersList,
  getRestaurantsList,
  getOrdersList,
  getRevenueAnalytics,
} = require("../controllers/adminController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

// Middleware to restrict access to Admins only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied: Admin privileges required");
  }
};

router.use(protect);
router.use(adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/users", getUsersList);
router.get("/restaurants", getRestaurantsList);
router.get("/orders", getOrdersList);
router.get("/revenue", getRevenueAnalytics);

module.exports = router;
