const express = require("express");
const FeaturedSection = require("../models/FeaturedSection");
const router = express.Router();

// Get all active featured sections with populated items
router.get("/", async (req, res) => {
  try {
    const list = await FeaturedSection.find({ isVisible: true })
      .populate({
        path: "items",
        populate: { path: "restaurant", select: "name" }
      })
      .sort({ displayOrder: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve sections: " + error.message });
  }
});

module.exports = router;
