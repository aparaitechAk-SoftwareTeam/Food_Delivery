const express = require("express");
const Category = require("../models/Category");
const router = express.Router();

router.get("/", async (req, res) => {
  
  const categories = await Category.find();
  res.json(categories);
});

module.exports = router;
