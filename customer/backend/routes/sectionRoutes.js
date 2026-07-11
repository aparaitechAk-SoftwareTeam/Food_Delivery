const express = require("express");
const mongoose = require("mongoose");
const FeaturedSection = require("../models/FeaturedSection");
const router = express.Router();

const shouldUseMockData = () => process.env.MOCK_DB === "true" || mongoose.connection.readyState !== 1;

// Get all active featured sections with populated items
router.get("/", async (req, res) => {
  try {
    if (shouldUseMockData()) {
      const { sections, foods, initializeMockData } = require("../config/mockDataStore");
      initializeMockData();
      if (sections.length > 0) return res.json(sections);

      return res.json([
        {
          _id: "mock-featured",
          id: "mock-featured",
          title: "Popular Picks",
          subtitle: "Fresh favorites ready now",
          displayOrder: 1,
          isVisible: true,
          items: foods.filter((food) => food.isPopular || food.isFeatured).slice(0, 8),
        },
      ]);
    }

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
