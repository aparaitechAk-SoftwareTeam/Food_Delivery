const Banner = require("../models/Banner");
const mongoose = require("mongoose");

const shouldUseMockData = () => process.env.MOCK_DB === "true" || mongoose.connection.readyState !== 1;

// Get all active promotional banners
exports.getBanners = async (req, res) => {
<<<<<<< HEAD
  if (shouldUseMockData()) {
    const { banners, initializeMockData } = require("../config/mockDataStore");
    initializeMockData();
    return res.json(banners);
  }
=======
  
>>>>>>> fa7365685005be48c263c78c95718b01658f1a65
  const banners = await Banner.find({ isActive: true });
  res.json(banners);
};

// Create a banner (admin helper)
exports.createBanner = async (req, res) => {
  const { title, description, image, cta } = req.body;
  if (!title || !image) {
    res.status(400);
    throw new Error("Title and image are required");
  }

  const banner = await Banner.create({
    title,
    description,
    image,
    cta,
  });

  res.status(201).json(banner);
};
