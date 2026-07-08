const express = require("express");
const Category = require("../models/Category");
const router = express.Router();

router.get("/", async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { categories } = require("../config/mockDataStore");
    return res.json(categories);
  }
  const categories = await Category.find();
  res.json(categories);
});

module.exports = router;
