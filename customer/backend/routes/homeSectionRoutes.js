const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

// Middleware to restrict access to Admins only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied: Admin privileges required");
  }
};

const HomeSection = require("../models/HomeSection");

// Public GET route
router.get("/", async (req, res) => {
  try {
    const sections = await HomeSection.find().sort({ displayOrder: 1 });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin-only PUT route
router.put("/:key", protect, adminOnly, async (req, res) => {
  try {
    const { key } = req.params;
    const { title, isVisible, displayOrder } = req.body;
    const updated = await HomeSection.findOneAndUpdate(
      { key },
      { $set: { title, isVisible, displayOrder } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Home section not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
