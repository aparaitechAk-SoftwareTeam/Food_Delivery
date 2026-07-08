const express = require("express");
const {
  getDashboardStats,
  getUsersList,
  getRestaurantsList,
  getOrdersList,
  getRevenueAnalytics,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getFoods,
  createFood,
  updateFood,
  deleteFood,
  getCombos,
  createCombo,
  updateCombo,
  deleteCombo,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  bulkUpload,
  bulkUpdate,
  updateRestaurantDetails,
  updateOrderStatus,
  toggleBlockUser,
  getReviews,
  updateReviewStatus,
  deleteReview,
  getDeliveryBoys,
  createDeliveryBoy,
  updateDeliveryBoy,
  deleteDeliveryBoy,
  assignOrderToRider,
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

// Categories CRUD
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Foods CRUD
router.get("/foods", getFoods);
router.post("/foods", createFood);
router.put("/foods/:id", updateFood);
router.delete("/foods/:id", deleteFood);

// Combos CRUD
router.get("/combos", getCombos);
router.post("/combos", createCombo);
router.put("/combos/:id", updateCombo);
router.delete("/combos/:id", deleteCombo);

// Banners CRUD
router.get("/banners", getBanners);
router.post("/banners", createBanner);
router.put("/banners/:id", updateBanner);
router.delete("/banners/:id", deleteBanner);

// Featured Sections CRUD
router.get("/sections", getSections);
router.post("/sections", createSection);
router.put("/sections/:id", updateSection);
router.delete("/sections/:id", deleteSection);

// Restaurant Details Update
router.put("/restaurant", updateRestaurantDetails);

// Bulk Operations
router.post("/bulk-upload", bulkUpload);
router.post("/bulk-update", bulkUpdate);

// New Integrations
router.put("/orders/:id/status", updateOrderStatus);
router.put("/users/:id/block", toggleBlockUser);
router.get("/reviews", getReviews);
router.put("/reviews/:id/status", updateReviewStatus);
router.delete("/reviews/:id", deleteReview);

// Delivery Boy Management Integrations
router.get("/delivery-boys", getDeliveryBoys);
router.post("/delivery-boys", createDeliveryBoy);
router.put("/delivery-boys/:id", updateDeliveryBoy);
router.delete("/delivery-boys/:id", deleteDeliveryBoy);
router.put("/orders/:id/assign", assignOrderToRider);

module.exports = router;
