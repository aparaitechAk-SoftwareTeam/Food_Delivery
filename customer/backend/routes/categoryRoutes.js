const express = require("express");
const Category = require("../models/Category");
const router = express.Router();

router.get("/", async (req, res) => {
  const categories = await Category.find({ isVisible: { $ne: false } }).sort({ priority: 1, name: 1 });
  res.json(categories);
});

module.exports = router;
