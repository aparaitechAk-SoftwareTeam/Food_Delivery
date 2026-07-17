const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const reviewController = require("../controllers/reviewController");

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied: Admin privileges required");
  }
};

// Public review retrieval for a food item
router.get("/food/:foodId", reviewController.getReviewsByFood);

// Protected customer actions
router.post("/", protect, reviewController.createReview);
router.put("/:id", protect, reviewController.updateReview);
router.delete("/:id", protect, reviewController.deleteReview);
router.get("/user", protect, reviewController.getReviewsByUser);
router.get("/order/:orderId", protect, reviewController.getReviewsByOrder);

// Protected admin actions
router.get("/admin", protect, adminOnly, reviewController.getAllReviewsAdmin);
router.put("/:id/status", protect, adminOnly, reviewController.updateStatus);

module.exports = router;
