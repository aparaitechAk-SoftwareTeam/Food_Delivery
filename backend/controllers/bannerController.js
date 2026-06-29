const Banner = require("../models/Banner");

// Get all active promotional banners
exports.getBanners = async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { banners } = require("../config/mockDataStore");
    return res.json(banners);
  }
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
