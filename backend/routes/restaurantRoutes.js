const express = require("express");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

router.get("/", async (req, res) => {
  if (process.env.MOCK_DB === "true") {
    const { restaurants } = require("../config/mockDataStore");
    return res.json(restaurants);
  }
  const restaurants = await Restaurant.find();
  res.json(restaurants);
});

module.exports = router;
